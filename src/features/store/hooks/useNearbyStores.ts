"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreMapSnapshot } from "@/features/store/lib/storeMapSnapshot";
import {
  defaultMapLocation,
  SEARCH_RADIUS_KM,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import { getOpenFilterKey } from "@/features/store/lib/storeOpenHours";
import type { StoreLocation, StoreOpenFilter } from "@/features/store/types";
import { useFetchNearbyStores } from "@/entities/store";
import { showToast } from "@/shared/providers/ToastProvider";

/** "이 지역에 매장 없음" 안내 후 직전 지역으로 지도를 되돌리기까지의 지연(ms). */
const RESTORE_AREA_DELAY_MS = 1400;

/** 사용자가 고른 지역의 조회 key. 내 위치 key("lat:lng:filter")와 겹치지 않게 앞에 area를 붙인다. */
const toAreaLookupKey = (area: MapSearchPoint, openFilterKey: string) =>
  `area:${area.lat}:${area.lng}:${openFilterKey}`;

type SearchState = ReturnType<typeof useStoreSearchState>;

type UseNearbyStoresParams = Pick<
  SearchState,
  "areaSearchRequestIdRef" | "setSubmittedSearchStores"
> &
  Pick<ReturnType<typeof useStoreMapState>, "setSelectedStoreId"> & {
    setFocusPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
    setIsMapSearchLoading: Dispatch<SetStateAction<boolean>>;
    setIsWaitingForPinSelection: Dispatch<SetStateAction<boolean>>;
    setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setStores: Dispatch<SetStateAction<StoreLocation[]>>;
    setStoresOrigin: Dispatch<SetStateAction<MapSearchPoint | null>>;
    /** 영업 시간 필터. 바뀌면 같은 지점을 그 조건으로 다시 조회한다. */
    openFilter: StoreOpenFilter;
    /** 로그인 후 돌아와 되살린 지도 화면. 있으면 들어올 때의 자동 조회·내 위치 이동을 건너뛴다. */
    restoredSnapshot: StoreMapSnapshot | null;
    /** 위치를 받으면 내 위치로 지도를 옮기고 주변 매장을 불러올지 */
    shouldFocusUserLocationRef: RefObject<boolean>;
    userLocation: UserLocation | null;
  };

/**
 * 주변 매장 조회: 들어올 때(내 위치 또는 기본 위치), 내 위치를 받았을 때, 지점을 골라 다시 조회할 때.
 * 조회 결과가 없으면 직전에 보던 지역으로 지도를 되돌린다.
 *
 * 내 위치 따라가기: 처음에는 내 위치(없으면 기본 위치) 주변 매장을 보여주고 위치가 바뀌면 다시 조회한다.
 * 사용자가 지역을 직접 고르면("이 위치에서 검색" 등) 따라가기를 끄고, 위치가 바뀌어도 그 지역 결과를 유지한다
 * (지도 서비스들과 같은 방식). "내 위치" 버튼을 누르면 다시 따라간다.
 */
export const useNearbyStores = ({
  areaSearchRequestIdRef,
  setFocusPoint,
  setHasSelectedStoreInfo,
  setIsMapSearchLoading,
  setIsWaitingForPinSelection,
  setSearchPoint,
  setSelectedStoreId,
  setStores,
  setStoresOrigin,
  setSubmittedSearchStores,
  openFilter,
  restoredSnapshot,
  shouldFocusUserLocationRef,
  userLocation,
}: UseNearbyStoresParams) => {
  const fetchNearbyStores = useFetchNearbyStores();
  const openFilterKey = getOpenFilterKey(openFilter);
  // 되살린 화면이면 처음 위치를 받아도 내 위치로 지도를 옮기지 않는다(보던 지역을 유지).
  const hasFocusedInitialLocationRef = useRef(Boolean(restoredSnapshot));
  // 되살린 화면은 사용자가 보던 지역이라 따라가기를 끈 상태로 시작한다.
  const isFollowingUserLocationRef = useRef(!restoredSnapshot);
  // 따라가기를 끈 뒤 결과를 유지할 지역. 영업 시간 필터를 바꾸면 이 지역을 그 조건으로 다시 조회한다.
  // (ref 초기값은 렌더 중 ref를 읽지 않도록 같은 값을 따로 계산해 넣는다.)
  const initialChosenArea =
    restoredSnapshot?.storesOrigin ?? defaultMapLocation;
  const chosenAreaRef = useRef<MapSearchPoint>(initialChosenArea);
  // 되살린 화면이면 들어올 때의 자동 조회를 건너뛴다(되살린 매장 목록을 덮어쓰지 않도록).
  const lastNearbyLookupKeyRef = useRef(
    restoredSnapshot ? toAreaLookupKey(initialChosenArea, openFilterKey) : "",
  );
  // 마지막으로 매장이 1곳 이상 조회된 지역. "이 위치에서 검색" 결과가 없으면 이곳으로 지도를 되돌린다.
  const lastStoreAreaRef = useRef<MapSearchPoint>(
    restoredSnapshot?.storesOrigin ?? defaultMapLocation,
  );
  const nearbyLookup = useMemo(() => {
    const lookupLocation = userLocation ?? defaultMapLocation;

    if (!lookupLocation) {
      return null;
    }

    const lat = Number(lookupLocation.lat.toFixed(3));
    const lng = Number(lookupLocation.lng.toFixed(3));

    return {
      key: `${lat}:${lng}:${openFilterKey}`,
      location: { lat, lng },
    };
  }, [openFilterKey, userLocation]);

  const updateStoresByLocation = (
    lookupLocation: MapSearchPoint,
    options?: {
      showLoadingCard?: boolean;
      restoreOnEmpty?: boolean;
      /** 내 위치 주변으로 돌아가는 조회면 true. 없으면 사용자가 고른 지역으로 보고 따라가기를 끈다. */
      followUserLocation?: boolean;
    },
  ) => {
    let isCurrentRequest = true;
    // 결과가 없어 직전 지역으로 되돌아갈 때 따라가기 상태도 함께 되돌린다.
    const previousFollowState = {
      area: chosenAreaRef.current,
      isFollowing: isFollowingUserLocationRef.current,
      lookupKey: lastNearbyLookupKeyRef.current,
    };

    if (options?.followUserLocation) {
      isFollowingUserLocationRef.current = true;
      lastNearbyLookupKeyRef.current = nearbyLookup?.key ?? "";
    } else {
      isFollowingUserLocationRef.current = false;
      chosenAreaRef.current = lookupLocation;
      lastNearbyLookupKeyRef.current = toAreaLookupKey(
        lookupLocation,
        openFilterKey,
      );
    }
    // 결과가 없거나 실패하면 기존 매장 핀은 그대로 두고, 직전에 보던 지역으로 지도를 되돌린다.
    const restorePreviousArea = (message: string) => {
      showToast(message);
      chosenAreaRef.current = previousFollowState.area;
      isFollowingUserLocationRef.current = previousFollowState.isFollowing;
      lastNearbyLookupKeyRef.current = previousFollowState.lookupKey;
      setSearchPoint(null);
      setHasSelectedStoreInfo(false);
      setIsWaitingForPinSelection(false);

      // 안내 문구를 읽을 틈을 준 뒤 직전 지역으로 지도를 되돌린다.
      const previousArea = { ...lastStoreAreaRef.current };

      window.setTimeout(() => {
        setFocusPoint(previousArea);
      }, RESTORE_AREA_DELAY_MS);
    };

    // 새 지역을 조회하면 이전 Enter 검색 결과 표시는 해제한다(진행 중인 영역 검색 응답도 무효화).
    areaSearchRequestIdRef.current += 1;
    setSubmittedSearchStores(null);

    if (options?.showLoadingCard) {
      setIsMapSearchLoading(true);
      setIsWaitingForPinSelection(false);
      setHasSelectedStoreInfo(false);
    }

    fetchNearbyStores(lookupLocation, { openFilter })
      .then((nearbyStores) => {
        if (isCurrentRequest) {
          if (options?.restoreOnEmpty && nearbyStores.length === 0) {
            restorePreviousArea(
              `이 지역 반경 ${SEARCH_RADIUS_KM}km 안에는 매장 정보가 없어요. 직전에 보던 지역으로 돌아갈게요.`,
            );
            return;
          }

          if (nearbyStores.length > 0) {
            lastStoreAreaRef.current = lookupLocation;
          }

          setStoresOrigin(lookupLocation);
          setStores(nearbyStores);

          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          if (options?.restoreOnEmpty) {
            restorePreviousArea("매장 정보를 불러오지 못했어요.");
            return;
          }

          setStores([]);
          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .finally(() => {
        if (isCurrentRequest && options?.showLoadingCard) {
          setIsMapSearchLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  };

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (
      !hasFocusedInitialLocationRef.current ||
      shouldFocusUserLocationRef.current
    ) {
      const shouldShowCurrentLocationSearch =
        shouldFocusUserLocationRef.current;

      setFocusPoint({ lat: userLocation.lat, lng: userLocation.lng });
      setSearchPoint(null);
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;

      if (shouldShowCurrentLocationSearch) {
        // 위치 동의/내 위치 버튼 직후에는 "이 위치에서 검색"을 거치지 않고 바로 주변 매장 핀을 띄운다.
        const lat = Number(userLocation.lat.toFixed(3));
        const lng = Number(userLocation.lng.toFixed(3));

        isFollowingUserLocationRef.current = true;

        lastNearbyLookupKeyRef.current = `${lat}:${lng}:${openFilterKey}`;
        fetchNearbyStores({ lat, lng }, { openFilter })
          .then((nearbyStores) => {
            setStoresOrigin({ lat, lng });
            setStores(nearbyStores);
          })
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }
    // 상태 변경 함수(setter)와 ref는 패널에서 넘겨받지만 항상 같은 값이라, 기존처럼 위치가 바뀔 때만 실행된다.
  }, [
    fetchNearbyStores,
    setFocusPoint,
    setSearchPoint,
    setStores,
    setStoresOrigin,
    openFilter,
    openFilterKey,
    shouldFocusUserLocationRef,
    userLocation,
  ]);

  useEffect(() => {
    if (!nearbyLookup) {
      return;
    }

    // 따라가기 중이면 내 위치(기본 위치) 주변을, 아니면 사용자가 고른 지역을 조회한다.
    // 따라가기를 끈 상태에서는 위치가 바뀌어도 key가 같아 다시 조회하지 않고, 영업 시간 필터가 바뀔 때만 조회한다.
    const lookup = isFollowingUserLocationRef.current
      ? nearbyLookup
      : {
          key: toAreaLookupKey(chosenAreaRef.current, openFilterKey),
          location: chosenAreaRef.current,
        };

    if (lastNearbyLookupKeyRef.current === lookup.key) {
      return;
    }

    lastNearbyLookupKeyRef.current = lookup.key;

    let isCurrentRequest = true;
    let isSettled = false;

    fetchNearbyStores(lookup.location, { openFilter })
      .then((nearbyStores) => {
        isSettled = true;

        if (isCurrentRequest) {
          if (nearbyStores.length > 0) {
            lastStoreAreaRef.current = lookup.location;
          }

          setStoresOrigin(lookup.location);
          setStores(nearbyStores);
        }
      })
      .catch(() => {
        isSettled = true;

        if (isCurrentRequest) {
          setStores([]);
        }
      });

    return () => {
      isCurrentRequest = false;

      // 응답 전에 취소되면(개발 모드 StrictMode의 effect 재실행 등) 같은 지점을 다시 조회할 수 있게 기록을 지운다.
      // 지우지 않으면 재실행된 effect가 "이미 조회함"으로 보고 건너뛰어 매장이 하나도 안 뜬다.
      if (!isSettled) {
        lastNearbyLookupKeyRef.current = "";
      }
    };
    // setter는 항상 같은 값이라, 기존처럼 조회 지점(nearbyLookup)이 바뀔 때만 실행된다.
  }, [
    fetchNearbyStores,
    nearbyLookup,
    openFilter,
    openFilterKey,
    setStores,
    setStoresOrigin,
  ]);

  /** "내 위치" 버튼: 다시 내 위치를 따라간다. 지금 위치 주변 조회는 버튼 쪽에서 바로 한다. */
  const resumeFollowingUserLocation = () => {
    isFollowingUserLocationRef.current = true;
    lastNearbyLookupKeyRef.current = nearbyLookup?.key ?? "";
  };

  return {
    hasFocusedInitialLocationRef,
    lastNearbyLookupKeyRef,
    nearbyLookup,
    resumeFollowingUserLocation,
    updateStoresByLocation,
  };
};

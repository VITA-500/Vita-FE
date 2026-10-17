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
import { storeService } from "@/features/store/lib/storeService";
import type { StoreLocation, StoreOpenFilter } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

/** "이 지역에 매장 없음" 안내 후 직전 지역으로 지도를 되돌리기까지의 지연(ms). */
const RESTORE_AREA_DELAY_MS = 1400;

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
  const openFilterKey = getOpenFilterKey(openFilter);
  // 되살린 화면이면 처음 위치를 받아도 내 위치로 지도를 옮기지 않는다(보던 지역을 유지).
  const hasFocusedInitialLocationRef = useRef(Boolean(restoredSnapshot));
  const lastNearbyLookupKeyRef = useRef("");
  // 되살린 화면이면 들어올 때·위치를 받았을 때의 자동 주변 조회를 건너뛴다(되살린 매장 목록을 덮어쓰지 않도록).
  // 영업 시간 필터를 바꾸는 등 사용자가 조건을 바꾸면 그때부터는 원래대로 조회한다.
  const skipAutoLookupOpenFilterKeyRef = useRef<string | null>(
    restoredSnapshot ? openFilterKey : null,
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
    options?: { showLoadingCard?: boolean; restoreOnEmpty?: boolean },
  ) => {
    let isCurrentRequest = true;
    // 결과가 없거나 실패하면 기존 매장 핀은 그대로 두고, 직전에 보던 지역으로 지도를 되돌린다.
    const restorePreviousArea = (message: string) => {
      showToast(message);
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

    storeService
      .fetchNearbyStores(lookupLocation, undefined, { openFilter })
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

        lastNearbyLookupKeyRef.current = `${lat}:${lng}:${openFilterKey}`;
        storeService
          .fetchNearbyStores({ lat, lng }, undefined, { openFilter })
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

    if (lastNearbyLookupKeyRef.current === nearbyLookup.key) {
      return;
    }

    lastNearbyLookupKeyRef.current = nearbyLookup.key;

    if (skipAutoLookupOpenFilterKeyRef.current !== null) {
      if (skipAutoLookupOpenFilterKeyRef.current === openFilterKey) {
        return;
      }

      skipAutoLookupOpenFilterKeyRef.current = null;
    }

    let isCurrentRequest = true;
    let isSettled = false;

    storeService
      .fetchNearbyStores(nearbyLookup.location, undefined, { openFilter })
      .then((nearbyStores) => {
        isSettled = true;

        if (isCurrentRequest) {
          if (nearbyStores.length > 0) {
            lastStoreAreaRef.current = nearbyLookup.location;
          }

          setStoresOrigin(nearbyLookup.location);
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
  }, [nearbyLookup, openFilter, openFilterKey, setStores, setStoresOrigin]);

  return {
    hasFocusedInitialLocationRef,
    lastNearbyLookupKeyRef,
    nearbyLookup,
    updateStoresByLocation,
  };
};

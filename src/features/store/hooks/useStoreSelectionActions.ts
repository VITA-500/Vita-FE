"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { useLocationPermission } from "@/features/store/hooks/useLocationPermission";
import type { useNearbyStores } from "@/features/store/hooks/useNearbyStores";
import type { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import type { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import type { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import type { useStoreSearchResults } from "@/features/store/hooks/useStoreSearchResults";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import {
  defaultMapLocation,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import {
  getGeolocationPermissionState,
  LOCATION_CONSENT_STORAGE_KEY,
  readStorage,
} from "@/features/store/lib/storePanelStorage";
import { storeService } from "@/features/store/lib/storeService";
import type { MapCategory, StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

type UseStoreSelectionActionsParams = Pick<
  ReturnType<typeof useStoreMapState>,
  | "requestLocation"
  | "searchQuery"
  | "setSearchQuery"
  | "setSelectedStoreId"
  | "userLocation"
  | "watchLocation"
> &
  Pick<
    ReturnType<typeof useStoreRoute>,
    "resetRouteState" | "routeDestinationStoreId" | "startRoute"
  > &
  Pick<
    ReturnType<typeof useStoreSearchResults>,
    | "categoryDisplayStores"
    | "categoryStores"
    | "isTagSearchQuery"
    | "searchableStores"
  > &
  Pick<
    ReturnType<typeof useStoreSearchState>,
    "searchAddedStoreIdsRef" | "setSearchAnchorSource"
  > &
  Pick<
    ReturnType<typeof useNearbyStores>,
    "hasFocusedInitialLocationRef" | "updateStoresByLocation"
  > &
  Pick<
    ReturnType<typeof useLocationPermission>,
    "openLocationPermissionModal"
  > &
  Pick<
    ReturnType<typeof useStorePanelLayout>,
    "setIsSearchHistoryOpen" | "setIsStoreListCollapsed"
  > & {
    activeMapCategory: MapCategory;
    routeDestinationStore?: StoreLocation;
    setActiveMapCategory: Dispatch<SetStateAction<MapCategory>>;
    setFocusPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
    setIsWaitingForPinSelection: Dispatch<SetStateAction<boolean>>;
    setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setSoloStoreId: Dispatch<SetStateAction<string>>;
    setStores: Dispatch<SetStateAction<StoreLocation[]>>;
    setStoresOrigin: Dispatch<SetStateAction<MapSearchPoint | null>>;
    shouldFocusUserLocationRef: RefObject<boolean>;
    stores: StoreLocation[];
  };

/** 매장 선택·길찾기 시작·내 위치로 이동·길찾기 후 주변 매장 보기 */
export const useStoreSelectionActions = ({
  activeMapCategory,
  categoryDisplayStores,
  categoryStores,
  hasFocusedInitialLocationRef,
  isTagSearchQuery,
  openLocationPermissionModal,
  requestLocation,
  resetRouteState,
  routeDestinationStore,
  routeDestinationStoreId,
  searchableStores,
  searchAddedStoreIdsRef,
  searchQuery,
  setActiveMapCategory,
  setFocusPoint,
  setHasSelectedStoreInfo,
  setIsSearchHistoryOpen,
  setIsStoreListCollapsed,
  setIsWaitingForPinSelection,
  setSearchAnchorSource,
  setSearchPoint,
  setSearchQuery,
  setSelectedStoreId,
  setSoloStoreId,
  setStores,
  setStoresOrigin,
  shouldFocusUserLocationRef,
  startRoute,
  stores,
  updateStoresByLocation,
  userLocation,
  watchLocation,
}: UseStoreSelectionActionsParams) => {
  const handleStoreSelect = (
    storeId: string,
    options?: { focusMap?: boolean; showOnlySelected?: boolean },
  ) => {
    setSoloStoreId(options?.showOnlySelected ? storeId : "");

    // 길찾기 중 다른 매장을 고르면 기존 경로를 지우고 새로 고른 매장 정보만 보여준다.
    if (routeDestinationStoreId && routeDestinationStoreId !== storeId) {
      resetRouteState();
    }

    setHasSelectedStoreInfo(true);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId(storeId);

    const nextStore =
      categoryDisplayStores.find((store) => store.id === storeId) ??
      categoryStores.find((store) => store.id === storeId) ??
      searchableStores.find((store) => store.id === storeId) ??
      stores.find((store) => store.id === storeId);

    if (nextStore && !stores.some((store) => store.id === nextStore.id)) {
      setStores((prevStores) => [...prevStores, nextStore]);

      // 텍스트 검색 중에 골라 매장 묶음에 새로 들어간 매장은 기록해 두었다가 검색을 지울 때 뺀다.
      if (searchQuery.trim() && !isTagSearchQuery) {
        searchAddedStoreIdsRef.current.add(nextStore.id);
      }
    }

    storeService
      .fetchStoreDetail(storeId, nextStore)
      .then((storeDetail) => {
        if (!storeDetail) {
          return;
        }

        setStores((prevStores) => {
          const hasStore = prevStores.some((store) => store.id === storeId);

          if (!hasStore) {
            // 위에서 추가했던 매장이 그사이(검색 지우기 등) 빠졌다면 다시 넣지 않는다.
            return nextStore ? prevStores : [...prevStores, storeDetail];
          }

          return prevStores.map((store) =>
            store.id === storeId
              ? {
                  ...store,
                  ...storeDetail,
                  distanceText: storeDetail.distanceText ?? store.distanceText,
                }
              : store,
          );
        });
      })
      .catch(() => {
        if (!nextStore) {
          showToast("매장 정보를 불러오지 못했어요.");
        }
      });

    if (options?.focusMap) {
      if (nextStore) {
        setFocusPoint({ lat: nextStore.lat, lng: nextStore.lng });
        setSearchPoint(null);
      }
    }
  };

  const handleRouteStart = (store: StoreLocation) => {
    startRoute(store.id);
    handleStoreSelect(store.id, { focusMap: true });

    // 모바일은 화면이 좁아 카드·매장 목록이 경로를 가리므로 기본으로 닫아 둔다(도착 핀을 누르면 카드가 다시 열림).
    if (window.innerWidth < 768) {
      setHasSelectedStoreInfo(false);
      setIsStoreListCollapsed(true);
    }

    if (userLocation) {
      watchLocation();
      return;
    }

    // 위치가 아직 없을 때: 권한이 이미 있으면 바로 추적하고, 아직 묻지 않았으면 모달만 띄운다.
    // (모달과 브라우저 권한 팝업이 동시에 뜨지 않도록 모달 동의 후에 추적을 시작한다.)
    void getGeolocationPermissionState().then((permissionState) => {
      if (permissionState === "denied") {
        resetRouteState();
        showToast(
          "브라우저 설정에서 위치 권한을 허용하면 경로를 볼 수 있어요.",
        );
        return;
      }

      if (
        permissionState === "granted" ||
        (permissionState === null &&
          readStorage("local", LOCATION_CONSENT_STORAGE_KEY) === "granted")
      ) {
        watchLocation();
        showToast("현재 위치를 확인한 뒤 경로를 표시할게요.");
        return;
      }

      openLocationPermissionModal();
    });
  };

  const closeSelectedStoreInfo = () => {
    setHasSelectedStoreInfo(false);
    setSoloStoreId("");
  };
  /**
   * 목록 토글(매장/제휴 혜택) 전환. 이전 탭에서 고른 매장의 정보 카드·길찾기는 새 탭 목록과 맞지 않으므로 닫는다.
   */
  const changeMapCategory = (category: MapCategory) => {
    if (category === activeMapCategory) {
      return;
    }

    if (routeDestinationStoreId) {
      resetRouteState();
    }

    setActiveMapCategory(category);
    setHasSelectedStoreInfo(false);
    setIsWaitingForPinSelection(false);
    setSoloStoreId("");
    setSelectedStoreId("");
  };
  const showNearbyStoresAfterRoute = () => {
    const currentPoint = routeDestinationStore
      ? { lat: routeDestinationStore.lat, lng: routeDestinationStore.lng }
      : userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : defaultMapLocation;

    resetRouteState();

    // 제휴 혜택 탭에서 길찾기를 했다면 탭을 유지하고, 이미 불러온 제휴 매장 핀으로 돌아간다.
    // (매장 탭으로 넘기거나 주변 일반 매장을 다시 조회하지 않는다)
    if (activeMapCategory === "benefit") {
      setIsSearchHistoryOpen(false);
      setHasSelectedStoreInfo(false);
      setSoloStoreId("");
      setSelectedStoreId("");
      setFocusPoint(currentPoint);
      return;
    }

    setActiveMapCategory("store");
    setSearchQuery("");
    setIsSearchHistoryOpen(false);
    setHasSelectedStoreInfo(false);
    setIsWaitingForPinSelection(true);
    setSelectedStoreId("");
    setFocusPoint(currentPoint);
    setSearchPoint(currentPoint);
    updateStoresByLocation(currentPoint, { showLoadingCard: true });
  };
  const focusUserLocation = () => {
    shouldFocusUserLocationRef.current = true;
    // 내 위치로 이동: 이후 텍스트 검색 정렬 중심은 내 위치
    setSearchAnchorSource("user");

    // 길찾기 중이면 위치 추적(watch)만, 아니면 한 번 조회만 한다. (동시에 두 번 요청하지 않도록)
    if (!routeDestinationStoreId) {
      requestLocation();
    }

    if (userLocation) {
      setFocusPoint({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
      setSearchPoint(null);
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;

      if (!routeDestinationStoreId) {
        storeService
          .fetchNearbyStores({ lat: userLocation.lat, lng: userLocation.lng })
          .then((nearbyStores) => {
            setStoresOrigin({ lat: userLocation.lat, lng: userLocation.lng });
            setStores(nearbyStores);
          })
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }

    if (routeDestinationStoreId) {
      watchLocation();
    }
  };

  return {
    changeMapCategory,
    closeSelectedStoreInfo,
    focusUserLocation,
    handleRouteStart,
    handleStoreSelect,
    showNearbyStoresAfterRoute,
  };
};

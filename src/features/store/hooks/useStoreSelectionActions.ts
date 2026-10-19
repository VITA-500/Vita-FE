"use client";

import {
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { useInitialStoreAction } from "@/features/store/hooks/useInitialStoreAction";
import type { useLocationPermission } from "@/features/store/hooks/useLocationPermission";
import type { useNearbyStores } from "@/features/store/hooks/useNearbyStores";
import type { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import type { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import type { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import { useStoreRouteReturnActions } from "@/features/store/hooks/useStoreRouteReturnActions";
import type { useStoreSearchResults } from "@/features/store/hooks/useStoreSearchResults";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import {
  findStoreById,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import {
  getGeolocationPermissionState,
  LOCATION_CONSENT_STORAGE_KEY,
} from "@/features/store/lib/storePanelStorage";
import type { MapCategory, StoreLocation } from "@/features/store/types";
import { readStorage } from "@/shared/lib/browserStorage";
import { useFetchNearbyStores, useFetchStoreDetail } from "@/entities/store";
import { showToast } from "@/shared/providers/ToastProvider";

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
    | "changeRouteMode"
    | "resetRouteState"
    | "routeDestinationStoreId"
    | "startRoute"
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
    | "hasFocusedInitialLocationRef"
    | "resumeFollowingUserLocation"
    | "updateStoresByLocation"
  > &
  Pick<
    ReturnType<typeof useLocationPermission>,
    "openLocationPermissionModal"
  > &
  Pick<ReturnType<typeof useStorePanelLayout>, "setIsSearchHistoryOpen"> & {
    activeMapCategory: MapCategory;
    routeDestinationStore?: StoreLocation;
    setActiveMapCategory: Dispatch<SetStateAction<MapCategory>>;
    setSelectedBenefitCategory: Dispatch<SetStateAction<string>>;
    setFocusPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
    setIsWaitingForPinSelection: Dispatch<SetStateAction<boolean>>;
    setRouteReturnServices: Dispatch<SetStateAction<string[]>>;
    setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setSoloStoreId: Dispatch<SetStateAction<string>>;
    setStores: Dispatch<SetStateAction<StoreLocation[]>>;
    setStoresOrigin: Dispatch<SetStateAction<MapSearchPoint | null>>;
    shouldFocusUserLocationRef: RefObject<boolean>;
    stores: StoreLocation[];
  };

export const useStoreSelectionActions = ({
  activeMapCategory,
  categoryDisplayStores,
  categoryStores,
  changeRouteMode,
  hasFocusedInitialLocationRef,
  resumeFollowingUserLocation,
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
  setIsWaitingForPinSelection,
  setRouteReturnServices,
  setSearchAnchorSource,
  setSearchPoint,
  setSearchQuery,
  setSelectedBenefitCategory,
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
  const fetchNearbyStores = useFetchNearbyStores();
  const fetchStoreDetail = useFetchStoreDetail();
  const showStoreOnMap = (
    storeId: string,
    storeDetail: StoreLocation,
    category: MapCategory = "store",
  ) => {
    setActiveMapCategory(category);
    setSoloStoreId(storeId);
    setHasSelectedStoreInfo(true);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId(storeId);
    setFocusPoint({ lat: storeDetail.lat, lng: storeDetail.lng });
    setSearchPoint(null);
    setStores((prevStores) => {
      const hasStore = prevStores.some((store) => store.id === storeId);

      if (!hasStore) {
        return [...prevStores, storeDetail];
      }

      return prevStores.map((store) =>
        store.id === storeId ? { ...store, ...storeDetail } : store,
      );
    });
  };

  const handleStoreSelect = (
    storeId: string,
    options?: { focusMap?: boolean; showOnlySelected?: boolean },
  ) => {
    setSoloStoreId(options?.showOnlySelected ? storeId : "");

    if (routeDestinationStoreId && routeDestinationStoreId !== storeId) {
      resetRouteState();
    }

    setHasSelectedStoreInfo(true);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId(storeId);

    const nextStore = findStoreById(
      storeId,
      categoryDisplayStores,
      categoryStores,
      searchableStores,
      stores,
    );

    if (nextStore && !stores.some((store) => store.id === nextStore.id)) {
      setStores((prevStores) => [...prevStores, nextStore]);

      if (searchQuery.trim() && !isTagSearchQuery) {
        searchAddedStoreIdsRef.current.add(nextStore.id);
      }
    }

    fetchStoreDetail(storeId, nextStore)
      .then((storeDetail) => {
        if (!storeDetail) {
          return;
        }

        setStores((prevStores) => {
          const hasStore = prevStores.some((store) => store.id === storeId);

          if (!hasStore) {
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
    startRoute(store);
    // 모바일도 길찾기 정보를 바텀 시트에 바로 띄운다(경로는 시트 위쪽 지도 영역에 맞춘다).
    handleStoreSelect(store.id, { focusMap: true });

    if (userLocation) {
      watchLocation();
      return;
    }

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

  const { handleInitialStoreAction } = useInitialStoreAction({
    categoryDisplayStores,
    categoryStores,
    changeRouteMode,
    handleRouteStart,
    searchableStores,
    setActiveMapCategory,
    setRouteReturnServices,
    setSelectedBenefitCategory,
    showStoreOnMap,
    stores,
  });

  const closeSelectedStoreInfo = () => {
    setHasSelectedStoreInfo(false);
    setSoloStoreId("");
  };
  const storeTabSearchQueryRef = useRef("");
  const changeMapCategory = (category: MapCategory) => {
    if (category === activeMapCategory) {
      return;
    }

    if (category === "benefit") {
      storeTabSearchQueryRef.current = searchQuery;
      setSearchQuery("");
    } else {
      setSearchQuery(storeTabSearchQueryRef.current);
      storeTabSearchQueryRef.current = "";
    }

    setIsSearchHistoryOpen(false);

    if (routeDestinationStoreId) {
      resetRouteState();
    }

    setActiveMapCategory(category);
    setHasSelectedStoreInfo(false);
    setIsWaitingForPinSelection(false);
    setSoloStoreId("");
    setSelectedStoreId("");
  };
  const { showNearbyStoresAfterRoute } = useStoreRouteReturnActions({
    activeMapCategory,
    resetRouteState,
    routeDestinationStore,
    setActiveMapCategory,
    setFocusPoint,
    setHasSelectedStoreInfo,
    setIsSearchHistoryOpen,
    setIsWaitingForPinSelection,
    setSearchPoint,
    setSearchQuery,
    setSelectedBenefitCategory,
    setSelectedStoreId,
    setSoloStoreId,
    updateStoresByLocation,
    userLocation,
  });
  const focusUserLocation = () => {
    shouldFocusUserLocationRef.current = true;
    resumeFollowingUserLocation();
    // 내 위치로 이동: 이후 텍스트 검색 정렬 중심은 내 위치
    setSearchAnchorSource("user");

    // 길찾기 중이면 위치 추적(watch)만, 아니면 한 번 조회만 한다. (동시에 두 번 요청하지 않도록)
    if (!routeDestinationStoreId) {
      requestLocation();
    }

    if (userLocation) {
      setFocusPoint({ lat: userLocation.lat, lng: userLocation.lng });
      setSearchPoint(null);
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;

      if (!routeDestinationStoreId) {
        fetchNearbyStores({ lat: userLocation.lat, lng: userLocation.lng })
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
    handleInitialStoreAction,
    handleRouteStart,
    handleStoreSelect,
    showNearbyStoresAfterRoute,
  };
};

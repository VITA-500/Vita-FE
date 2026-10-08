"use client";

import { useEffect, useRef } from "react";
import { useLocationPermission } from "@/features/store/hooks/useLocationPermission";
import { useNearbyStores } from "@/features/store/hooks/useNearbyStores";
import { useStoreFilterSearchActions } from "@/features/store/hooks/useStoreFilterSearchActions";
import type { useStoreMapPanelState } from "@/features/store/hooks/useStoreMapPanelState";
import { useStoreSelectionActions } from "@/features/store/hooks/useStoreSelectionActions";
import { useStoreTextSearchActions } from "@/features/store/hooks/useStoreTextSearchActions";

export type StoreMapPanelState = ReturnType<typeof useStoreMapPanelState>;

/**
 * 매장 지도 패널의 동작: 주변 매장 조회, 매장 선택·길찾기·내 위치, 위치 권한, 필터(태그)·텍스트 검색.
 * 각 hook은 패널 상태(useStoreMapPanelState)를 그대로 받아 필요한 값만 꺼내 쓴다.
 */
export const useStoreMapPanelActions = (state: StoreMapPanelState) => {
  const nearby = useNearbyStores(state);
  const pendingServiceReturnRef = useRef<string[] | null>(null);
  const selection = useStoreSelectionActions({
    ...state,
    ...nearby,
    // 위치 허용 모달은 아래 useLocationPermission이 연다(길찾기를 시작하는 시점에 호출된다).
    openLocationPermissionModal: () =>
      locationPermission.openLocationPermissionModal(),
  });
  const locationPermission = useLocationPermission({
    isRouteActive: Boolean(state.routeDestinationStoreId),
    locationStatus: state.locationStatus,
    // 모달에서 "위치 허용"을 누르는 시점에 호출된다.
    onConsent: () => selection.focusUserLocation(),
    onRouteCancel: state.resetRouteState,
    requestLocation: state.requestLocation,
    shouldFocusUserLocationRef: state.shouldFocusUserLocationRef,
    userLocation: state.userLocation,
  });
  const searchActionParams = {
    ...state,
    ...nearby,
    ...selection,
    addHistory: state.addSearchHistory,
  };
  const filterSearch = useStoreFilterSearchActions(searchActionParams);
  const textSearch = useStoreTextSearchActions({
    ...searchActionParams,
    ...filterSearch,
  });
  const applyRouteReturnServices = (services: string[]) => {
    state.resetRouteState();
    state.setActiveMapCategory("store");
    state.setSearchQuery("");
    state.setIsSearchHistoryOpen(false);
    state.setHasSelectedStoreInfo(false);
    state.setIsWaitingForPinSelection(false);
    state.setSoloStoreId("");
    state.setSelectedStoreId("");

    if (!state.userLocation) {
      pendingServiceReturnRef.current = services;
      locationPermission.openLocationPermissionModal();
      return;
    }

    pendingServiceReturnRef.current = null;
    state.setFocusPoint({
      lat: state.userLocation.lat,
      lng: state.userLocation.lng,
    });
    state.setSearchPoint(null);

    if (!filterSearch.applyServiceFilterSearch(services)) {
      selection.showNearbyStoresAfterRoute();
    }
  };
  const showNearbyStoresAfterRoute = () => {
    if (state.routeReturnServices.length > 0) {
      applyRouteReturnServices(state.routeReturnServices);
      return;
    }

    selection.showNearbyStoresAfterRoute();
  };

  useEffect(() => {
    const services = pendingServiceReturnRef.current;

    if (!services || !state.userLocation) {
      return;
    }

    applyRouteReturnServices(services);
    // 서비스 복귀 요청은 userLocation이 생기는 순간 한 번만 재개한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userLocation]);

  return {
    ...nearby,
    ...selection,
    ...locationPermission,
    ...filterSearch,
    ...textSearch,
    showNearbyStoresAfterRoute,
  };
};

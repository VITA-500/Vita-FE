"use client";

import { useEffect, useRef } from "react";
import { useLocationPermission } from "@/features/store/panel/hooks/useLocationPermission";
import { useNearbyStores } from "@/features/store/search/hooks/useNearbyStores";
import { useStoreFilterSearchActions } from "@/features/store/search/hooks/useStoreFilterSearchActions";
import type { useStoreMapPanelState } from "@/features/store/panel/hooks/useStoreMapPanelState";
import { useStoreSelectionActions } from "@/features/store/panel/hooks/useStoreSelectionActions";
import { useStoreTextSearchActions } from "@/features/store/search/hooks/useStoreTextSearchActions";

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
    onConsent: () => {
      // 위치 허용은 사용자가 명시적으로 현재 위치를 요청한 동작이다.
      // 필터 결과가 갱신돼도 자동 핀 맞춤이 이 카메라 이동을 덮어쓰지 않게 한다.
      state.setCameraOwner("user");
      selection.focusUserLocation();
    },
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
    state.setCameraOwner("auto");
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
    changeRouteMode: (mode: Parameters<typeof state.changeRouteMode>[0]) => {
      state.cancelReservation();
      state.changeRouteMode(mode);
    },
    // 예약 화면이 열린 상태에서 길찾기로 전환하면 이전 예약 상태가
    // 데스크톱 길찾기 하단에 다시 표시되지 않도록 닫는다.
    handleRouteStart: (
      store: Parameters<typeof selection.handleRouteStart>[0],
    ) => {
      state.cancelReservation();
      selection.handleRouteStart(store);
    },
    selectTransitRoute: (index: number) => {
      state.cancelReservation();
      state.selectTransitRoute(index);
    },
    showNearbyStoresAfterRoute,
    focusUserLocation: () => {
      // 내 위치 버튼은 필터 선택 여부와 무관하게 사용자의 카메라 이동으로 본다.
      // 필터 검색 결과가 다시 그려지는 시점의 자동 맞춤보다 우선해야 한다.
      state.setCameraOwner("user");
      selection.focusUserLocation();
    },
    setOpenFilter: (...args: Parameters<typeof state.setOpenFilter>) => {
      state.setCameraOwner("auto");
      state.setOpenFilter(...args);
    },
    changeMapCategory: (
      ...args: Parameters<typeof selection.changeMapCategory>
    ) => {
      state.setCameraOwner("auto");
      selection.changeMapCategory(...args);
    },
    changeBenefitCategory: (
      ...args: Parameters<typeof state.changeBenefitCategory>
    ) => {
      state.setCameraOwner("auto");
      state.changeBenefitCategory(...args);
    },
    setBenefitServiceFilters: (
      ...args: Parameters<typeof state.setBenefitServiceFilters>
    ) => {
      state.setCameraOwner("auto");
      state.setBenefitServiceFilters(...args);
    },
    clearBenefitServiceFilters: () => {
      state.setCameraOwner("auto");
      state.clearBenefitServiceFilters();
    },
  };
};

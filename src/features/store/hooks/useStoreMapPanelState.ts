"use client";

import { useRef, useState } from "react";
import { useBenefitStores } from "@/features/store/hooks/useBenefitStores";
import { useServiceFilters } from "@/features/store/hooks/useServiceFilters";
import { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import { useStorePagination } from "@/features/store/hooks/useStorePagination";
import { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import { useStoreReservation } from "@/features/store/hooks/useStoreReservation";
import { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import { useStoreSearchHistory } from "@/features/store/hooks/useStoreSearchHistory";
import { useStoreSearchResults } from "@/features/store/hooks/useStoreSearchResults";
import { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import { buildMarkerColorInfoById } from "@/features/store/lib/markerColors";
import type { StoreMapSnapshot } from "@/features/store/lib/storeMapSnapshot";
import { ALL_STORE_OPEN_FILTER } from "@/features/store/lib/storeOpenHours";
import {
  buildRoutePreview,
  buildRouteSummary,
} from "@/features/store/lib/storeRoutePreview";
import {
  buildMarkerLabelById,
  defaultMapLocation,
  getMapStoreVisibility,
  getSameLocationStores,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import type {
  MapCategory,
  StoreLocation,
  StoreOpenFilter,
} from "@/features/store/types";

// 지도 화면은 검색, 필터, 위치, 길찾기 상태가 강하게 맞물린다.
// 새 상태를 추가할 때는 useStoreMapState로 먼저 분리할 수 있는지 확인한다.
/**
 * 매장 지도 패널의 상태와 화면에 보여줄 값: 매장 목록·선택, 검색 상태·결과, 길찾기, 필터, 페이지,
 * 지도 핀·카드에 넘길 값. 동작(조회·검색·선택)은 useStoreMapPanelActions가 이 값을 받아 처리한다.
 */
export const useStoreMapPanelState = (
  /** 로그인하러 가기 전에 보던 지도 화면. 있으면 각 상태의 처음 값으로 쓴다(StoreMapPanel이 읽어 넘긴다). */
  restoredSnapshot: StoreMapSnapshot | null = null,
) => {
  // 고른 매장은 지금 매장 묶음(stores) 안에 있을 때만 되살린다(아니면 첫 매장으로 바뀌어 다른 매장 정보가 뜬다).
  const restoredSelectedStoreId =
    restoredSnapshot &&
    restoredSnapshot.stores.some(
      (store) => store.id === restoredSnapshot.selectedStoreId,
    )
      ? restoredSnapshot.selectedStoreId
      : "";
  const reservation = useStoreReservation();
  const [stores, setStores] = useState<StoreLocation[]>(
    restoredSnapshot?.stores ?? [],
  );
  const [focusPoint, setFocusPoint] = useState<MapSearchPoint | null>(
    restoredSnapshot?.mapViewport?.center ?? defaultMapLocation,
  );
  const layout = useStorePanelLayout(restoredSnapshot?.isStoreListCollapsed);
  const [soloStoreId, setSoloStoreId] = useState(
    restoredSelectedStoreId ? (restoredSnapshot?.soloStoreId ?? "") : "",
  );
  // 현재 stores를 조회한 기준 지점(내 위치·지도에서 고른 지점 등). 매장 순서(A, B, C…)는 이 지점에서 가까운 순이다.
  const [storesOrigin, setStoresOrigin] = useState<MapSearchPoint | null>(
    restoredSnapshot?.storesOrigin ?? null,
  );
  // 핀(현재 페이지 12곳) 외 나머지 매장 위치를 반투명 원으로 함께 보여줄지
  const [isOtherStoresVisible, setIsOtherStoresVisible] = useState(false);
  const [searchFitTarget, setSearchFitTarget] = useState<{
    key: string;
    points: MapSearchPoint[];
    smooth?: boolean;
  } | null>(null);
  const {
    addHistory: addSearchHistory,
    clearHistory: clearSearchHistory,
    history: searchHistory,
    isHistoryEnabled: isSearchHistoryEnabled,
    removeHistory: removeSearchHistory,
    toggleHistoryEnabled: toggleSearchHistoryEnabled,
  } = useStoreSearchHistory();
  const [searchPoint, setSearchPoint] = useState<MapSearchPoint | null>(null);
  const [isMapSearchLoading, setIsMapSearchLoading] = useState(false);
  const [isWaitingForPinSelection, setIsWaitingForPinSelection] =
    useState(false);
  const [hasSelectedStoreInfo, setHasSelectedStoreInfo] = useState(
    Boolean(restoredSelectedStoreId && restoredSnapshot?.hasSelectedStoreInfo),
  );
  const [activeMapCategory, setActiveMapCategory] = useState<MapCategory>(
    restoredSnapshot?.activeMapCategory ?? "store",
  );
  const [openFilter, setOpenFilter] = useState<StoreOpenFilter>(
    restoredSnapshot?.openFilter ?? ALL_STORE_OPEN_FILTER,
  );
  const [routeReturnServices, setRouteReturnServices] = useState<string[]>([]);
  const shouldFocusUserLocationRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapState = useStoreMapState(stores, {
    searchQuery: restoredSnapshot?.searchQuery,
    selectedStoreId: restoredSelectedStoreId,
  });
  const {
    displayStores,
    locationStatus,
    searchQuery,
    selectedStore,
    userLocation,
  } = mapState;
  const searchState = useStoreSearchState({
    focusPoint,
    initial: restoredSnapshot,
    searchQuery,
    setHasSelectedStoreInfo,
    userLocation,
  });
  const {
    allStores,
    getTextSearchSortCenter,
    isInVisibleArea,
    submittedSearchOrigin,
    submittedSearchStores,
  } = searchState;
  const route = useStoreRoute(userLocation);
  const benefit = useBenefitStores({
    activeMapCategory,
    initialSelectedBenefitCategory: restoredSnapshot?.selectedBenefitCategory,
    openFilter,
    userLocation,
  });
  const {
    isRouteLoading,
    routeDestinationStoreId,
    routeMapReadyKey,
    routeMode,
    routeResultMessage,
    walkingRoute,
  } = route;
  const filters = useServiceFilters({
    allStores,
    initialConsultServiceFilters: restoredSnapshot?.consultServiceFilters,
    initialProvidedServiceFilters: restoredSnapshot?.providedServiceFilters,
    stores,
  });
  const {
    consultServiceFilterOptions,
    consultServiceFilters,
    filterStoresByServices,
    hasActiveServiceFilter,
    providedServiceFilterOptions,
    providedServiceFilters,
    serviceFilterColorByValue,
  } = filters;
  const results = useStoreSearchResults({
    activeMapCategory,
    allStores,
    benefitStores: benefit.filteredBenefitStores,
    benefitStoresOrigin: benefit.benefitStoresOrigin,
    consultServiceFilterOptions,
    displayStores,
    filterStoresByServices,
    getTextSearchSortCenter,
    hasActiveServiceFilter,
    isInVisibleArea,
    openFilter,
    providedServiceFilterOptions,
    searchQuery,
    selectedStore,
    stores,
    storesOrigin,
    submittedSearchOrigin,
    submittedSearchStores,
    userLocation,
  });
  const { categorySelectedStore, categoryStores, mapStores } = results;
  const routeDestinationStore =
    categoryStores.find((store) => store.id === routeDestinationStoreId) ??
    stores.find((store) => store.id === routeDestinationStoreId);
  // 매장 목록에서 고른 매장은 정보 카드가 떠 있는 동안 그 핀만 남기고 다른 핀은 숨긴다.
  const soloStore =
    hasSelectedStoreInfo && soloStoreId
      ? (categoryStores.find((store) => store.id === soloStoreId) ??
        stores.find((store) => store.id === soloStoreId))
      : undefined;
  const pagination = useStorePagination({
    mapStores,
    onPageChangeStart: ({
      mapStoresKey: pageSourceKey,
      nextPage,
      pageStores,
    }) => {
      setSoloStoreId("");
      setHasSelectedStoreInfo(false);

      // 페이지를 넘기면 그 페이지 매장 핀(A~L)이 모두 보이도록 지도를 부드럽게 옮긴다.
      if (pageStores.length > 0) {
        setSearchFitTarget({
          key: `page:${pageSourceKey}:${nextPage}`,
          points: pageStores.map((store) => ({
            lat: store.lat,
            lng: store.lng,
          })),
          smooth: true,
        });
      }
    },
  });
  const { pagedMapStores } = pagination;
  // 다른 페이지에 있는 매장을 골라 카드가 떠 있으면(검색·묶음 핀 등) 그 핀도 함께 보여준다.
  const selectedStoreOutsidePage =
    hasSelectedStoreInfo &&
    selectedStore &&
    !pagedMapStores.some((store) => store.id === selectedStore.id)
      ? selectedStore
      : undefined;
  const markerLabelById = buildMarkerLabelById(
    pagedMapStores,
    selectedStoreOutsidePage,
  );
  const activeServiceFilters = [
    ...consultServiceFilters,
    ...providedServiceFilters,
  ];
  // 핀 색: 탭마다 필터가 다르므로 매장 탭은 상담·서비스 필터, 제휴 탭은 혜택 뱃지 필터 기준으로 칠한다.
  const markerColorInfoById =
    activeMapCategory === "benefit"
      ? benefit.benefitMarkerColorInfoById
      : buildMarkerColorInfoById({
          activeServiceFilters,
          colorByValue: serviceFilterColorByValue,
          stores: mapStores,
        });

  const { otherMapStores, visibleMapStores } = getMapStoreVisibility({
    mapStores,
    pagedMapStores,
    routeDestinationStore,
    routeDestinationStoreId,
    selectedStoreOutsidePage,
    soloStore,
  });
  const routeSummary = buildRouteSummary({
    isRouteLoading,
    routeDestinationStore,
    routeMode,
    userLocation,
    walkingRoute,
  });
  const routePreview = buildRoutePreview({
    isRouteLoading,
    routeDestinationStore,
    routeDestinationStoreId,
    routeMode,
    routeResultMessage,
    userLocation,
    walkingRoute,
  });
  // 경로 응답을 받은 뒤에도 지도 범위를 맞추는 동안에는 탐색 중 모달을 유지한다.
  const isRouteMapPreparing = Boolean(
    routePreview && routeMapReadyKey !== routePreview.routeKey,
  );
  const isRouteSearchOverlayVisible =
    (isRouteLoading || isRouteMapPreparing) &&
    locationStatus !== "denied" &&
    locationStatus !== "error" &&
    locationStatus !== "unsupported";
  const mapSelectedStore =
    routeDestinationStoreId && routeDestinationStore
      ? routeDestinationStore
      : categorySelectedStore;
  const mapSelectedStoreId =
    routeDestinationStoreId && routeDestinationStore
      ? routeDestinationStore.id
      : (categorySelectedStore?.id ?? "");
  // 선택 매장과 같은 좌표(소수 5자리, 지도 묶음 핀과 같은 기준)에 있는 매장들
  const sameLocationStores = getSameLocationStores(
    mapSelectedStore,
    mapStores,
    stores,
  );
  const showStoreInfoCard =
    hasSelectedStoreInfo &&
    (isWaitingForPinSelection || Boolean(mapSelectedStore));

  return {
    ...reservation,
    ...layout,
    ...mapState,
    ...searchState,
    ...route,
    ...benefit,
    ...filters,
    ...results,
    ...pagination,
    activeMapCategory,
    addSearchHistory,
    clearSearchHistory,
    focusPoint,
    hasSelectedStoreInfo,
    isMapSearchLoading,
    isOtherStoresVisible,
    isRouteSearchOverlayVisible,
    isSearchHistoryEnabled,
    isWaitingForPinSelection,
    mapSelectedStore,
    mapSelectedStoreId,
    markerColorInfoById,
    markerLabelById,
    otherMapStores,
    removeSearchHistory,
    restoredSnapshot,
    routeDestinationStore,
    routePreview,
    routeReturnServices,
    routeSummary,
    sameLocationStores,
    searchFitTarget,
    searchHistory,
    searchInputRef,
    openFilter,
    searchPoint,
    setActiveMapCategory,
    setFocusPoint,
    setHasSelectedStoreInfo,
    setIsMapSearchLoading,
    setIsOtherStoresVisible,
    setIsWaitingForPinSelection,
    setOpenFilter,
    setRouteReturnServices,
    setSearchFitTarget,
    setSearchPoint,
    setSoloStoreId,
    setStores,
    setStoresOrigin,
    shouldFocusUserLocationRef,
    showStoreInfoCard,
    soloStore,
    soloStoreId,
    stores,
    storesOrigin,
    toggleSearchHistoryEnabled,
    visibleMapStores,
  };
};

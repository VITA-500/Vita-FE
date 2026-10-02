"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { StorePanelInfoBubble } from "@/features/store/components/StorePanelInfoBubble";
import { StorePanelModals } from "@/features/store/components/StorePanelModals";
import { StorePanelSearchBar } from "@/features/store/components/StorePanelSearchBar";
import { StorePanelSearchDropdown } from "@/features/store/components/StorePanelSearchDropdown";
import { StorePanelServiceFilters } from "@/features/store/components/StorePanelServiceFilters";
import { StorePanelStoreList } from "@/features/store/components/StorePanelStoreList";
import { StorePanelRouteSearchOverlay } from "@/features/store/components/StorePanelRouteSearchOverlay";
import { useLocationPermission } from "@/features/store/hooks/useLocationPermission";
import { useServiceFilters } from "@/features/store/hooks/useServiceFilters";
import { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import { useStorePagination } from "@/features/store/hooks/useStorePagination";
import { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import { useStoreReservation } from "@/features/store/hooks/useStoreReservation";
import { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import {
  useStoreSearchHistory,
  type StoreSearchHistoryItem,
} from "@/features/store/hooks/useStoreSearchHistory";
import { matchesStoreSearch } from "@/features/store/lib/geo";
import { buildMarkerColorInfoById } from "@/features/store/lib/markerColors";
import { findServicesInText } from "@/features/store/lib/serviceKeywords";
import {
  getGeolocationPermissionState,
  LOCATION_CONSENT_STORAGE_KEY,
  readStorage,
} from "@/features/store/lib/storePanelStorage";
import {
  buildRoutePreview,
  buildRouteSummary,
} from "@/features/store/lib/storeRoutePreview";
import {
  buildMarkerLabelById,
  buildSearchableStores,
  defaultMapLocation,
  getMapStoreVisibility,
  getSameLocationStores,
  getViewportAreaQuery,
  isStoreInVisibleArea,
  SEARCH_RADIUS_KM,
  sortStoresByDistance,
  type MapSearchPoint,
  type MapViewport,
} from "@/features/store/lib/storePanelStores";
import { storeService } from "@/features/store/lib/storeService";
import type { MapCategory, StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

type StoreMapPanelProps = {
  onOpenSidebar?: () => void;
};

/** 마지막 필터 해제 후 매장을 다시 불러오는 동안 지도를 자동으로 옮기지 않는 시간(ms) */
const PIN_AUTO_FIT_SKIP_MS = 2500;

/** "이 지역에 매장 없음" 안내 후 직전 지역으로 지도를 되돌리기까지의 지연(ms). */
const RESTORE_AREA_DELAY_MS = 1400;

// 지도 화면은 검색, 필터, 위치, 길찾기 상태가 강하게 맞물린다.
// 새 상태를 추가할 때는 useStoreMapState로 먼저 분리할 수 있는지 확인한다.
export const StoreMapPanel = ({ onOpenSidebar }: StoreMapPanelProps) => {
  const {
    cancelReservation,
    closeLoginRequiredModal,
    handleReservationConfirm,
    handleReserve,
    isLoginRequiredModalOpen,
    isToastBackdropVisible,
    reservationStore,
  } = useStoreReservation();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [focusPoint, setFocusPoint] = useState<MapSearchPoint | null>(
    defaultMapLocation,
  );
  const {
    collapsedSearchRef,
    getMapPinFitPadding,
    isSearchHistoryOpen,
    isStoreListCollapsed,
    mapTopBarRef,
    panelRootRef,
    routeLeftInset,
    setIsSearchHistoryOpen,
    setIsStoreListCollapsed,
    storeListPanelRef,
  } = useStorePanelLayout();
  const [soloStoreId, setSoloStoreId] = useState("");
  const [mapCenter, setMapCenter] = useState<MapSearchPoint | null>(null);
  // 현재 stores를 조회한 기준 지점(내 위치·지도에서 고른 지점 등). 매장 순서(A, B, C…)는 이 지점에서 가까운 순이다.
  const [storesOrigin, setStoresOrigin] = useState<MapSearchPoint | null>(null);
  // 핀(현재 페이지 12곳) 외 나머지 매장 위치를 반투명 원으로 함께 보여줄지
  const [isOtherStoresVisible, setIsOtherStoresVisible] = useState(false);
  const [submittedSearchOrigin, setSubmittedSearchOrigin] =
    useState<MapSearchPoint | null>(null);
  const [submittedSearchStores, setSubmittedSearchStores] = useState<
    StoreLocation[] | null
  >(null);
  const [searchFitTarget, setSearchFitTarget] = useState<{
    key: string;
    points: MapSearchPoint[];
    smooth?: boolean;
  } | null>(null);
  // 좌표가 실제로 바뀐 경우에만 상태를 갱신해 불필요한 재렌더를 막는다.
  const updateMapCenter = useCallback((point: MapSearchPoint) => {
    setMapCenter((prevPoint) =>
      prevPoint &&
      Math.abs(prevPoint.lat - point.lat) < 1e-7 &&
      Math.abs(prevPoint.lng - point.lng) < 1e-7
        ? prevPoint
        : point,
    );
  }, []);
  // 검색용 매장 풀: 검색 기준 지역(지도 중심)마다 주변 매장을 조회해 누적한다.
  const [allStores, setAllStores] = useState<StoreLocation[]>([]);
  const loadedSearchAreaKeyRef = useRef("");
  // 지금 보이는 지도 영역(지도 이동·확대/축소가 끝날 때마다 갱신)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  // 텍스트 검색 정렬 중심 좌표의 출처: 내 위치 버튼·위치 허용 → "user", 사용자가 지도를 직접 옮김 → "map"
  const [searchAnchorSource, setSearchAnchorSource] = useState<"user" | "map">(
    "user",
  );
  // 텍스트 검색 결과에서 골라 stores에 새로 추가된 매장 id (검색을 지우면 stores에서 뺀다)
  const searchAddedStoreIdsRef = useRef<Set<string>>(new Set());
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
  const [hasSelectedStoreInfo, setHasSelectedStoreInfo] = useState(false);
  const [activeMapCategory, setActiveMapCategory] =
    useState<MapCategory>("store");
  const hasFocusedInitialLocationRef = useRef(false);
  const lastNearbyLookupKeyRef = useRef("");
  // 지도 영역 검색(searchVisibleArea) 요청 번호. 가장 최근 요청의 응답만 화면에 반영한다.
  const areaSearchRequestIdRef = useRef(0);
  // true인 동안 핀 자동 맞춤(지도 이동)을 하지 않는다. 필터 해제 직후 보던 화면을 그대로 두기 위해 쓴다.
  const isPinAutoFitSkippedRef = useRef(false);
  const pinAutoFitSkipTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(pinAutoFitSkipTimeoutRef.current);
    },
    [],
  );
  // 뱃지(필터) 검색 중 사용자가 지도를 끌어 옮겼다: 이동이 끝나면(idle) 보이는 영역에서 다시 찾는다.
  const shouldRefreshTagSearchOnIdleRef = useRef(false);
  const shouldFocusUserLocationRef = useRef(false);
  // 마지막으로 매장이 1곳 이상 조회된 지역. "이 위치에서 검색" 결과가 없으면 이곳으로 지도를 되돌린다.
  const lastStoreAreaRef = useRef<MapSearchPoint>(defaultMapLocation);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    displayStores,
    locationStatus,
    requestLocation,
    searchQuery,
    selectedStore,
    setSearchQuery,
    setSelectedStoreId,
    userLocation,
    watchLocation,
  } = useStoreMapState(stores);
  const {
    changeRouteMode,
    isRouteLoading,
    resetRouteState,
    routeDestinationStoreId,
    routeMapReadyKey,
    routeMode,
    routeResultMessage,
    setRouteMapReadyKey,
    startRoute,
    walkingRoute,
  } = useStoreRoute(userLocation);
  const {
    consultServiceFilterOptions,
    consultServiceFilters,
    filterStoresByServices,
    hasActiveServiceFilter,
    providedServiceFilterOptions,
    providedServiceFilters,
    serviceFilterColorByValue,
    setConsultServiceFilters,
    setProvidedServiceFilters,
  } = useServiceFilters({ allStores, stores });
  const {
    dismissLocationPermissionModal,
    isLocationPermissionModalOpen,
    openLocationPermissionModal,
    requestUserLocationFromModal,
  } = useLocationPermission({
    isRouteActive: Boolean(routeDestinationStoreId),
    locationStatus,
    // 모달에서 "위치 허용"을 누르는 시점에 호출된다(아래에서 정의하는 함수).
    onConsent: () => focusUserLocation(),
    onRouteCancel: resetRouteState,
    requestLocation,
    shouldFocusUserLocationRef,
    userLocation,
  });
  const categoryStores =
    activeMapCategory === "store" ? filterStoresByServices(stores) : [];
  const categoryDisplayStores =
    activeMapCategory === "store" ? filterStoresByServices(displayStores) : [];
  const categorySelectedStore =
    activeMapCategory === "store"
      ? (categoryDisplayStores.find(
          (store) => store.id === selectedStore?.id,
        ) ??
        categoryStores.find((store) => store.id === selectedStore?.id) ??
        categoryDisplayStores[0] ??
        categoryStores[0])
      : undefined;
  // 검색 풀 = 지역별로 조회해 둔 매장(allStores) + 현재 지도에 불러온 매장(stores).
  const searchableStores = useMemo(
    () => buildSearchableStores(allStores, stores, userLocation),
    [allStores, stores, userLocation],
  );
  // "#뱃지" 형태의 검색어는 필터 뱃지로 입력된 태그 검색이다(텍스트 매칭 대상 아님).
  const isTagSearchQuery = searchQuery.trim().startsWith("#");
  const matchedSearchStores =
    activeMapCategory !== "store"
      ? []
      : isTagSearchQuery
        ? filterStoresByServices(displayStores)
        : searchableStores.filter((store) =>
            matchesStoreSearch(store, searchQuery),
          );
  // 텍스트 검색은 지금 보고 있는 지도 중심 반경 안의 매장만 대상으로 하고, 중심에서 가까운 순으로 정렬한다.
  const searchCenter =
    mapCenter ??
    focusPoint ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  const searchCenterKey = `${searchCenter.lat.toFixed(4)}:${searchCenter.lng.toFixed(4)}`;
  /** 매장이 지금 보이는 지도 영역 안에 있는지 (영역 정보가 아직 없으면 반경 기준) */
  const isInVisibleArea = (
    store: Pick<StoreLocation, "lat" | "lng">,
    viewport: MapViewport | null = mapViewport,
  ) => isStoreInVisibleArea(store, viewport, searchCenter);
  /**
   * 텍스트 검색 정렬 기준(중심 좌표).
   * 내 위치 버튼·위치 허용 후라면 내 위치, 사용자가 지도를 직접 옮겼다면 보이는 지도 중심.
   */
  const getTextSearchSortCenter = (
    viewport: MapViewport | null = mapViewport,
    anchorSource: "user" | "map" = searchAnchorSource,
  ): MapSearchPoint => {
    const viewportCenter = viewport?.center ?? searchCenter;

    return anchorSource === "user" && userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : viewportCenter;
  };
  const getTextSearchResults = (pool: StoreLocation[]) =>
    sortStoresByDistance(
      pool.filter(
        (store) =>
          matchesStoreSearch(store, searchQuery) && isInVisibleArea(store),
      ),
      getTextSearchSortCenter(),
    );
  // 텍스트 검색 결과(서비스 필터 적용 전). Enter 검색 시 이 목록을 저장해 두고 뱃지로 다시 거른다.
  const textSearchStores = isTagSearchQuery
    ? matchedSearchStores
    : activeMapCategory === "store"
      ? getTextSearchResults(searchableStores)
      : [];
  // 검색어에서 알아낸 서비스(매장 데이터에 있는 서비스만)
  const availableServiceNames = [
    ...consultServiceFilterOptions.map((option) => option.value),
    ...providedServiceFilterOptions.map((option) => option.value),
  ];
  const searchedServices =
    searchQuery.trim() && !isTagSearchQuery
      ? findServicesInText(searchQuery, availableServiceNames)
      : [];
  const searchResultStores = isTagSearchQuery
    ? textSearchStores
    : filterStoresByServices(textSearchStores);
  // Enter로 검색하면 검색 결과 매장들을 지도 핀·매장 목록에 보여주고, 상단 뱃지로 그 안에서 다시 거른다.
  const unsortedMapStores = submittedSearchStores
    ? filterStoresByServices(submittedSearchStores)
    : hasActiveServiceFilter
      ? categoryDisplayStores
      : categoryStores;
  // 매장 목록·핀 순서(A, B, C…)는 필터 여부와 상관없이 항상 기준 지점에서 가까운 순이다.
  // 기준 지점: Enter 검색 결과면 검색한 순간의 검색 중심, 그 외에는 매장을 조회한 지점.
  // (지도가 움직여 검색 중심이 바뀌어도 순서·거리 표시가 흔들리지 않도록 고정된 지점을 쓴다)
  const storesSortOrigin =
    (submittedSearchStores ? submittedSearchOrigin : null) ??
    storesOrigin ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  // 목록에 보이는 거리도 같은 기준 지점에서 잰 값으로 맞춰, 순서와 거리 표시가 어긋나지 않게 한다.
  const mapStores = sortStoresByDistance(unsortedMapStores, storesSortOrigin);
  const routeDestinationStore =
    categoryStores.find((store) => store.id === routeDestinationStoreId) ??
    stores.find((store) => store.id === routeDestinationStoreId);
  // 매장 목록에서 고른 매장은 정보 카드가 떠 있는 동안 그 핀만 남기고 다른 핀은 숨긴다.
  const soloStore =
    hasSelectedStoreInfo && soloStoreId
      ? (categoryStores.find((store) => store.id === soloStoreId) ??
        stores.find((store) => store.id === soloStoreId))
      : undefined;
  const {
    activeStorePage,
    currentStorePage,
    firstPageSize,
    goToStorePage,
    hasMoreStorePages,
    isStorePaginationOn,
    mapStoresKey,
    pagedMapStores,
    showStorePagination,
    storePageCount,
  } = useStorePagination({
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
  const markerColorInfoById = buildMarkerColorInfoById({
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
  const nearbyLookup = useMemo(() => {
    const lookupLocation = userLocation ?? defaultMapLocation;

    if (!lookupLocation) {
      return null;
    }

    const lat = Number(lookupLocation.lat.toFixed(3));
    const lng = Number(lookupLocation.lng.toFixed(3));

    return {
      key: `${lat}:${lng}`,
      location: { lat, lng },
    };
  }, [userLocation]);

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
      .fetchNearbyStores(lookupLocation)
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

  /**
   * 필터 뱃지 변경. 검색창이 비어 있거나 이미 태그 검색(#…) 중이면
   * 선택한 뱃지를 "#텍스트"로 입력창에 넣고, 현재 지도 영역에서 매장을 다시 조회해 목록·핀으로 보여준다.
   */
  const handleServiceFilterChange = (
    kind: "consult" | "provided",
    nextValue: string[],
  ) => {
    const nextConsult = kind === "consult" ? nextValue : consultServiceFilters;
    const nextProvided =
      kind === "provided" ? nextValue : providedServiceFilters;

    if (kind === "consult") {
      setConsultServiceFilters(nextValue);
    } else {
      setProvidedServiceFilters(nextValue);
    }

    if (searchQuery.trim() && !isTagSearchQuery) {
      return;
    }

    startTagSearch(nextConsult, nextProvided);
  };
  /**
   * 뱃지(서비스) 태그 검색을 시작하거나 갱신한다.
   * 입력창에 "#서비스"를 넣고, 지금 불러와 둔 매장 안에서 걸러 첫 페이지 핀에 지도를 맞춘다.
   * 이미 태그 검색 결과가 있으면 서버를 다시 조회하지 않고 그 결과 안에서 뱃지 조건으로만 다시 거른다.
   * (뱃지를 더할수록 결과가 줄기만 하도록. 다른 지역 조회는 "이 위치에서 검색" 버튼으로만 한다)
   */
  const startTagSearch = (
    nextConsult: string[],
    nextProvided: string[],
    { forceFetch = false }: { forceFetch?: boolean } = {},
  ) => {
    const tags = [...nextConsult, ...nextProvided];

    setSearchQuery(tags.map((tag) => `#${tag}`).join(" "));
    setIsSearchHistoryOpen(false);

    // 마지막 뱃지를 해제하면 태그 검색 결과를 지우되, 지도는 내 위치로 돌아가지 않고 보던 화면을 유지한다.
    // 그 화면의 매장(필터 없이)을 불러와, 사용자가 그 지역에서 다시 검색하거나 뱃지를 고를 수 있게 한다.
    if (tags.length === 0) {
      restorePreTagSearchStores();
      isPinAutoFitSkippedRef.current = true;
      window.clearTimeout(pinAutoFitSkipTimeoutRef.current);
      pinAutoFitSkipTimeoutRef.current = window.setTimeout(() => {
        isPinAutoFitSkippedRef.current = false;
      }, PIN_AUTO_FIT_SKIP_MS);
      updateStoresByLocation(mapViewport?.center ?? searchCenter);
      return;
    }

    resetRouteState();
    setHasSelectedStoreInfo(false);

    // 모바일은 목록 패널이 화면을 크게 덮으므로 필터 선택만으로 목록을 펼치지 않는다(지도 핀으로 먼저 확인).
    if (window.innerWidth >= 768) {
      setIsStoreListCollapsed(false);
    }

    // 이미 불러온 태그 검색 결과가 있으면 재조회 없이 렌더 시 뱃지 조건으로만 다시 거른다.
    // 지도를 옮겨 둔 상태라면 "이 위치에서 검색" 버튼(searchPoint)은 그대로 남겨 둔다.
    if (!forceFetch && isTagSearchQuery && submittedSearchStores) {
      return;
    }

    setSearchPoint(null);

    // 카테고리(뱃지) 검색: 지금 보이는 지도 영역 기준으로 서버에서 다시 찾고,
    // 보이는 화면 중심에서 가까운 순으로 보여준다. (뱃지 조건은 렌더 시 적용)
    void searchVisibleArea("tag");
  };
  /**
   * 검색어나 채팅에서 알아낸 서비스로 매장을 찾는다(뱃지를 누른 것과 같은 태그 검색).
   * 매장명을 모르는 사용자가 "요금 수납", "유심" 처럼 하려는 일로 찾을 수 있게 한다.
   */
  const applyServiceFilterSearch = (services: string[]) => {
    const nextConsult = services.filter((service) =>
      consultServiceFilterOptions.some((option) => option.value === service),
    );
    const nextProvided = services.filter((service) =>
      providedServiceFilterOptions.some((option) => option.value === service),
    );

    if (nextConsult.length === 0 && nextProvided.length === 0) {
      return false;
    }

    // 텍스트 검색 중이었다면 정리하고 태그 검색으로 전환한다.
    if (searchQuery.trim() && !isTagSearchQuery) {
      clearTextSearchSession();
    }

    setSubmittedSearchStores(null);
    setConsultServiceFilters(nextConsult);
    setProvidedServiceFilters(nextProvided);
    startTagSearch(nextConsult, nextProvided, { forceFetch: true });

    return true;
  };
  /** 태그(뱃지) 검색 결과를 지우고 원래 매장 목록(지도에 불러와 둔 매장)으로 돌아간다. */
  const restorePreTagSearchStores = () => {
    // 아직 오지 않은 영역 검색 응답이 해제한 결과를 다시 띄우지 않도록 무효화한다.
    areaSearchRequestIdRef.current += 1;
    setSubmittedSearchStores(null);
    setHasSelectedStoreInfo(false);

    return true;
  };
  /** 지금 보이는 지도 영역을 덮는 조회 중심·반경(km). 반경은 화면 중심→모서리 거리, 최대 3km. */
  const getVisibleAreaQuery = (viewport: MapViewport | null = mapViewport) =>
    getViewportAreaQuery(viewport, searchCenter);
  /**
   * 보이는 지도 영역 기준 검색.
   * - text: 검색어에 맞는 매장을 영역 안에서 찾고, 중심 좌표(내 위치 또는 지도 중심)에서 가까운 순
   * - tag : 영역 안 매장을 모두 가져오고(뱃지 조건은 렌더 시 적용), 보이는 화면 중심에서 가까운 순
   * 결과는 검색 결과(submittedSearchStores)로만 보여주고, 원래 매장 목록(stores)은 건드리지 않는다.
   */
  const searchVisibleArea = async (
    mode: "text" | "tag",
    {
      anchorSource = searchAnchorSource,
      query = searchQuery,
      viewport = mapViewport,
    }: {
      anchorSource?: "user" | "map";
      query?: string;
      viewport?: MapViewport | null;
    } = {},
  ) => {
    const { center, radiusKm } = getVisibleAreaQuery(viewport);
    const requestId = ++areaSearchRequestIdRef.current;

    try {
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      // 그 사이 새 검색이 시작됐거나 결과가 해제됐으면 늦게 도착한 이 응답은 버린다.
      if (requestId !== areaSearchRequestIdRef.current) {
        return null;
      }

      // 입력 중 드롭다운 검색에도 쓰도록 검색용 매장 풀에 합쳐 둔다.
      mergeSearchStores(areaStores);

      const visibleStores = areaStores.filter((store) =>
        isInVisibleArea(store, viewport),
      );
      const results =
        mode === "text"
          ? visibleStores.filter((store) => matchesStoreSearch(store, query))
          : visibleStores;

      setSubmittedSearchOrigin(
        mode === "text"
          ? getTextSearchSortCenter(viewport, anchorSource)
          : center,
      );
      setSubmittedSearchStores(results);

      return results;
    } catch {
      if (requestId === areaSearchRequestIdRef.current) {
        showToast("매장 정보를 불러오지 못했어요.");
      }
      return null;
    }
  };
  /** 지도 이동·확대/축소가 끝날 때: 보이는 영역을 기억하고, 텍스트 검색 중 사용자가 지도를 옮겼으면 자동 재검색 */
  const handleViewportChange = (viewport: MapViewport) => {
    // 지도를 옮겨도 자동으로 다시 검색하지 않는다(화면만 둘러보려는 사용자를 헷갈리게 하지 않도록).
    // 다시 찾기는 "이 위치에서 검색" 버튼으로만 한다(searchInCurrentArea).
    // 단, 뱃지(필터) 검색 중에는 결과가 처음 찾은 지역에 묶여 옮긴 화면에 핀이 뜨지 않으므로,
    // 사용자가 직접 끌어 옮긴 경우에 한해 선택한 뱃지를 유지한 채 보이는 영역에서 다시 찾는다.
    setMapViewport(viewport);
    updateMapCenter(viewport.center);

    if (!shouldRefreshTagSearchOnIdleRef.current) {
      return;
    }

    shouldRefreshTagSearchOnIdleRef.current = false;

    if (
      !isTagSearchQuery ||
      !hasActiveServiceFilter ||
      routeDestinationStoreId
    ) {
      return;
    }

    setSearchPoint(null);
    setSoloStoreId("");
    void searchVisibleArea("tag", { viewport }).then((results) => {
      if (results && filterStoresByServices(results).length === 0) {
        showToast("이 지역에는 선택한 서비스를 제공하는 매장이 없어요.");
      }
    });
  };
  /**
   * "이 위치에서 검색" 버튼: 지금 보이는 지도 영역에서 다시 찾는다.
   * - 텍스트 검색 중: 검색어·뱃지를 유지한 채 옮긴 영역에서 검색어로 다시 찾음(정렬 중심은 옮긴 지도 중심)
   * - 뱃지(카테고리) 검색 중: 선택한 뱃지를 유지한 채 옮긴 영역에서 다시 찾음(정렬 중심은 화면 중심)
   * - 검색 없음: 옮긴 지점 주변 매장을 새로 불러옴(결과가 없으면 직전 지역으로 복귀)
   */
  const searchInCurrentArea = async () => {
    if (!searchPoint) {
      return;
    }

    const areaPoint = searchPoint;
    const isTextSearch = Boolean(searchQuery.trim()) && !isTagSearchQuery;
    const isCategorySearch = isTagSearchQuery && hasActiveServiceFilter;

    // 길찾기 중에 재검색하면 경로를 끝내고 새 지역 매장을 보여준다.
    // (길찾기 중에는 도착 매장 핀만 보이므로, 끝내지 않으면 새로 불러온 매장이 지도에 보이지 않는다)
    if (routeDestinationStoreId) {
      resetRouteState();
    }

    // 검색을 시작하면 "이 위치에서 검색" 대기 상태를 끝낸다.
    setSearchPoint(null);
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);

    if (isTextSearch) {
      const results = await searchVisibleArea("text", { anchorSource: "map" });

      if (results && results.length === 0) {
        showToast("이 지역에는 검색 결과가 없어요.");
      }
      return;
    }

    if (isCategorySearch) {
      const results = await searchVisibleArea("tag");
      const hasFilteredResult = results
        ? filterStoresByServices(results).length > 0
        : true;

      if (!hasFilteredResult) {
        showToast("이 지역에는 선택한 서비스를 제공하는 매장이 없어요.");
      }
      return;
    }

    updateStoresByLocation(areaPoint, {
      restoreOnEmpty: true,
      showLoadingCard: true,
    });
  };
  /** Enter 또는 검색 아이콘: 지금 보이는 지도 영역에서 찾은 검색 결과를 지도 핀·목록에 모두 보여준다. */
  const submitStoreSearch = async () => {
    setIsSearchHistoryOpen(false);

    if (isTagSearchQuery || !searchQuery.trim()) {
      return;
    }

    addSearchHistory(searchQuery);

    // 검색어가 하려는 일(서비스)을 뜻하면 매장명 검색보다 서비스 검색을 우선한다.
    if (
      searchedServices.length > 0 &&
      applyServiceFilterSearch(searchedServices)
    ) {
      searchInputRef.current?.blur();
      return;
    }

    resetRouteState();
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);
    setSearchPoint(null);

    // 텍스트 검색: 지금 보이는 지도 영역에서 찾고, 중심 좌표(내 위치 또는 지도 중심)에서 가까운 순으로 보여준다.
    const results = await searchVisibleArea("text");

    if (results && results.length === 0) {
      showToast("지금 보이는 지도 영역에 검색 결과가 없어요.");
    }

    // 모바일은 목록 패널이 화면을 크게 덮으므로 검색 결과도 지도 핀으로 먼저 보여주고, 목록은 사용자가 직접 펼친다.
    if (window.innerWidth >= 768) {
      setIsStoreListCollapsed(false);
    }

    searchInputRef.current?.blur();
  };
  /** 뱃지 필터를 모두 해제하고 기본 검색 방식(내 위치/기본 위치 주변 매장)으로 되돌린다. */
  const clearServiceFilters = () => {
    setConsultServiceFilters([]);
    setProvidedServiceFilters([]);

    // Enter 검색 결과를 보고 있는 중이면 결과는 그대로 두고 필터만 푼다.
    if (submittedSearchStores && !isTagSearchQuery) {
      return;
    }

    areaSearchRequestIdRef.current += 1;
    setSubmittedSearchStores(null);

    if (isTagSearchQuery) {
      setSearchQuery("");
    }

    // 태그 검색에서 해제한 경우: 태그 검색 결과만 지우고 원래 매장 목록으로 돌아간다.
    if (isTagSearchQuery) {
      return;
    }

    if (nearbyLookup) {
      lastNearbyLookupKeyRef.current = nearbyLookup.key;
      updateStoresByLocation(nearbyLookup.location);
    }
  };
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

    // 모바일은 화면이 좁아 카드가 경로를 가리므로 기본으로 닫아 둔다(도착 핀을 누르면 다시 열림).
    if (window.innerWidth < 768) {
      setHasSelectedStoreInfo(false);
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
  const showNearbyStoresAfterRoute = () => {
    const currentPoint = routeDestinationStore
      ? { lat: routeDestinationStore.lat, lng: routeDestinationStore.lng }
      : userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : defaultMapLocation;

    resetRouteState();
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
  /**
   * 텍스트 검색을 지울 때 검색 중에 쌓인 데이터를 정리한다.
   * - 검색 결과에서 골라 매장 묶음(stores)에 추가된 매장을 뺀다(원래 조회 지역 목록으로 복원)
   * - 검색용 매장 풀(allStores)을 비운다(다음 검색 때 그 지역을 다시 불러온다)
   */
  const clearTextSearchSession = () => {
    const addedStoreIds = new Set(searchAddedStoreIdsRef.current);

    searchAddedStoreIdsRef.current.clear();
    setAllStores([]);
    loadedSearchAreaKeyRef.current = "";

    if (addedStoreIds.size === 0) {
      return;
    }

    setStores((prevStores) =>
      prevStores.filter((store) => !addedStoreIds.has(store.id)),
    );

    // 빠지는 매장의 카드가 떠 있으면 닫는다.
    if (mapSelectedStore && addedStoreIds.has(mapSelectedStore.id)) {
      setHasSelectedStoreInfo(false);
      setSoloStoreId("");
    }
  };
  const mapSelectedStore = categorySelectedStore ?? routeDestinationStore;
  const mapSelectedStoreId =
    categorySelectedStore?.id ?? routeDestinationStore?.id ?? "";
  // 선택 매장과 같은 좌표(소수 5자리, 지도 묶음 핀과 같은 기준)에 있는 매장들
  const sameLocationStores = getSameLocationStores(
    mapSelectedStore,
    mapStores,
    stores,
  );
  const showStoreInfoCard =
    hasSelectedStoreInfo &&
    (isWaitingForPinSelection || Boolean(mapSelectedStore));

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

        lastNearbyLookupKeyRef.current = `${lat}:${lng}`;
        storeService
          .fetchNearbyStores({ lat, lng })
          .then((nearbyStores) => {
            setStoresOrigin({ lat, lng });
            setStores(nearbyStores);
          })
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (!nearbyLookup) {
      return;
    }

    if (lastNearbyLookupKeyRef.current === nearbyLookup.key) {
      return;
    }

    lastNearbyLookupKeyRef.current = nearbyLookup.key;

    let isCurrentRequest = true;
    let isSettled = false;

    storeService
      .fetchNearbyStores(nearbyLookup.location)
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
  }, [nearbyLookup]);

  const mergeSearchStores = (nextStores: StoreLocation[]) => {
    setAllStores((prevStores) => {
      const storeMap = new Map(prevStores.map((store) => [store.id, store]));

      nextStores.forEach((store) => {
        storeMap.set(store.id, { ...storeMap.get(store.id), ...store });
      });

      return Array.from(storeMap.values());
    });
  };
  /** 현재 검색 기준 지역(지도 중심) 주변 매장을 조회해 검색 풀에 넣는다. 이미 조회한 지역이면 건너뛴다. */
  const loadSearchAreaStores = async () => {
    if (loadedSearchAreaKeyRef.current === searchCenterKey) {
      return null;
    }

    try {
      const { center, radiusKm } = getVisibleAreaQuery();
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      loadedSearchAreaKeyRef.current = searchCenterKey;
      mergeSearchStores(areaStores);

      return areaStores;
    } catch {
      return null;
    }
  };
  const runStoreSearch = (storeId: string, query = searchQuery) => {
    handleStoreSelect(storeId, { focusMap: true });

    if (!query.trim().startsWith("#")) {
      addSearchHistory(query, storeId);
    }
    setIsSearchHistoryOpen(false);
  };

  /** 검색어 입력: 태그·텍스트 검색어를 모두 지웠을 때의 정리와 검색 풀 조회를 함께 처리한다. */
  const handleSearchQueryChange = (nextQuery: string) => {
    // 태그 검색어를 모두 지우면 뱃지 필터도 함께 해제한다.
    if (isTagSearchQuery && !nextQuery.trim()) {
      setConsultServiceFilters([]);
      setProvidedServiceFilters([]);
      restorePreTagSearchStores();
    }

    // 텍스트 검색어를 모두 지우면 검색 중에 쌓인 데이터를 정리한다.
    if (!isTagSearchQuery && searchQuery.trim() && !nextQuery.trim()) {
      clearTextSearchSession();
    }

    // 검색 풀을 비운 뒤 다시 입력하면 현재 지역 매장을 다시 불러온다(이미 불러왔으면 건너뜀).
    if (nextQuery.trim() && !nextQuery.trim().startsWith("#")) {
      void loadSearchAreaStores();
    }

    areaSearchRequestIdRef.current += 1;
    setSubmittedSearchStores(null);
    setSearchQuery(nextQuery);
  };
  const openSearchHistory = () => {
    setIsSearchHistoryOpen(true);
    void loadSearchAreaStores();
  };
  /** 이미 포커스된 검색창을 다시 누르면 드롭다운을 열고 닫는다. */
  const toggleSearchHistoryOnInputMouseDown = () => {
    if (document.activeElement === searchInputRef.current) {
      setIsSearchHistoryOpen((isOpen) => !isOpen);
      void loadSearchAreaStores();
    }
  };
  const selectSearchHistory = (item: StoreSearchHistoryItem) => {
    setSearchQuery(item.query);

    if (item.storeId) {
      runStoreSearch(item.storeId, item.query);
    } else {
      searchInputRef.current?.focus();
    }
  };

  return (
    <div
      ref={panelRootRef}
      className="relative h-full min-h-[640px] overflow-hidden"
    >
      <StoreMapPreview
        className="absolute inset-0"
        focusPoint={focusPoint}
        fitTarget={searchFitTarget}
        markerEnterKey={`${currentStorePage}:${mapStoresKey}`}
        getPinFitPadding={getMapPinFitPadding}
        // 새 핀 묶음이 꽂히거나 목록을 펼치고 접을 때 가장 바깥 핀이 가리지 않는지 확인한다.
        // (페이지 이동은 goToStorePage의 fitTarget이 같은 여백으로 맞춘다)
        pinAutoFitKey={`${mapStoresKey}|${isStoreListCollapsed ? "collapsed" : "expanded"}`}
        isPinAutoFitPaused={Boolean(
          routeDestinationStoreId || soloStore || hasSelectedStoreInfo,
        )}
        shouldSkipPinAutoFit={() => isPinAutoFitSkippedRef.current}
        isFullBleed
        isSearchFromMapPointLoading={isMapSearchLoading}
        routePreview={routePreview}
        onRouteMapReady={setRouteMapReadyKey}
        isRouteCardDocked={Boolean(
          routeDestinationStoreId &&
          routeDestinationStoreId === mapSelectedStore?.id,
        )}
        selectedStore={showStoreInfoCard ? mapSelectedStore : undefined}
        selectedStoreCard={
          showStoreInfoCard ? (
            <StorePanelInfoBubble
              isLoading={isMapSearchLoading}
              isWaitingForPinSelection={isWaitingForPinSelection}
              isRouteDestination={Boolean(
                routeDestinationStoreId &&
                routeDestinationStoreId === mapSelectedStore?.id,
              )}
              routeSummary={
                routeDestinationStoreId === mapSelectedStore?.id
                  ? routeSummary
                  : null
              }
              routeResultMessage={
                routeDestinationStoreId === mapSelectedStore?.id
                  ? routeResultMessage
                  : null
              }
              selectedRouteMode={routeMode}
              sameLocationStores={sameLocationStores}
              onSelectSameLocationStore={(storeId) =>
                handleStoreSelect(storeId, {
                  showOnlySelected: Boolean(soloStoreId),
                })
              }
              store={isWaitingForPinSelection ? undefined : mapSelectedStore}
              onShowNearbyStores={showNearbyStoresAfterRoute}
              onStartRoute={handleRouteStart}
              onRouteModeChange={changeRouteMode}
              onReserve={handleReserve}
            />
          ) : null
        }
        selectedStoreCardLeftInset={isStoreListCollapsed ? 0 : routeLeftInset}
        routeLeftInset={routeLeftInset}
        selectedStoreId={showStoreInfoCard ? mapSelectedStoreId : ""}
        stores={visibleMapStores}
        markerLabelById={markerLabelById}
        markerColorInfoById={markerColorInfoById}
        getRouteObstacleRect={() =>
          isStoreListCollapsed
            ? null
            : (storeListPanelRef.current?.getBoundingClientRect() ?? null)
        }
        // 길찾기 중 확대 등으로 경로·출발/도착·카드가 매장 목록 패널에 가리면 목록을 자동으로 접는다.
        onRouteObstructed={() => setIsStoreListCollapsed(true)}
        searchPoint={searchPoint}
        userLocation={userLocation}
        isUserLocationLoading={locationStatus === "requesting"}
        onFocusUserLocation={focusUserLocation}
        onMapPointSelect={(point) => {
          setSearchPoint(point);
          // 뱃지(필터) 검색 중이면 이동이 끝난 뒤 보이는 영역에서 자동으로 다시 찾는다.
          shouldRefreshTagSearchOnIdleRef.current =
            isTagSearchQuery && hasActiveServiceFilter;
          // 사용자가 지도를 직접 옮김: 이후 텍스트 검색 정렬 중심은 보이는 지도 중심
          setSearchAnchorSource("map");
        }}
        onViewportChange={handleViewportChange}
        onSelectedStoreCardClose={closeSelectedStoreInfo}
        onSearchFromMapPoint={() => {
          void searchInCurrentArea();
        }}
        onSelectStore={handleStoreSelect}
        otherStores={isOtherStoresVisible ? otherMapStores : []}
        otherStoreCount={otherMapStores.length}
        isOtherStoresVisible={isOtherStoresVisible}
        onToggleOtherStores={() =>
          setIsOtherStoresVisible((isVisible) => !isVisible)
        }
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        <div
          ref={mapTopBarRef}
          className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start"
        >
          <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-nowrap md:items-start">
            <div
              ref={collapsedSearchRef}
              className="relative w-[min(420px,calc(100vw-48px))] max-w-full min-w-0 shrink-0 self-center sm:self-start md:w-[360px] lg:w-[420px]"
            >
              <StorePanelSearchBar
                activeMapCategory={activeMapCategory}
                hasActiveServiceFilter={hasActiveServiceFilter}
                hasMoreStorePages={hasMoreStorePages}
                isStoreListCollapsed={isStoreListCollapsed}
                isTagSearchQuery={isTagSearchQuery}
                onClearFilters={clearServiceFilters}
                onInputFocus={openSearchHistory}
                onInputMouseDown={toggleSearchHistoryOnInputMouseDown}
                onOpenSidebar={onOpenSidebar}
                onQueryChange={handleSearchQueryChange}
                onSubmit={() => {
                  void submitStoreSearch();
                }}
                onToggleStoreList={() =>
                  setIsStoreListCollapsed((isCollapsed) => !isCollapsed)
                }
                pagedStoreCount={pagedMapStores.length}
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
                storeCount={mapStores.length}
              />

              {isSearchHistoryOpen && (
                <StorePanelSearchDropdown
                  isSearchHistoryEnabled={isSearchHistoryEnabled}
                  onClearHistory={clearSearchHistory}
                  onRemoveHistory={removeSearchHistory}
                  onSelectHistory={selectSearchHistory}
                  onSelectService={(service) => {
                    addSearchHistory(searchQuery);
                    applyServiceFilterSearch([service]);
                  }}
                  onSelectStore={(storeId) => runStoreSearch(storeId)}
                  onToggleHistoryEnabled={toggleSearchHistoryEnabled}
                  searchedServices={searchedServices}
                  searchHistory={searchHistory}
                  searchQuery={searchQuery}
                  searchResultStores={searchResultStores}
                />
              )}

              {!isStoreListCollapsed && (
                <StorePanelStoreList
                  activeMapCategory={activeMapCategory}
                  activeStorePage={activeStorePage}
                  currentStorePage={currentStorePage}
                  firstPageSize={firstPageSize}
                  hasMoreStorePages={hasMoreStorePages}
                  isStorePaginationOn={isStorePaginationOn}
                  mapSelectedStoreId={mapSelectedStoreId}
                  onCategoryChange={setActiveMapCategory}
                  onClose={() => setIsStoreListCollapsed(true)}
                  onPageChange={goToStorePage}
                  onSelectStore={(storeId) =>
                    handleStoreSelect(storeId, {
                      focusMap: true,
                      showOnlySelected: true,
                    })
                  }
                  onShowPagination={showStorePagination}
                  pagedMapStores={pagedMapStores}
                  panelRef={storeListPanelRef}
                  storeCount={mapStores.length}
                  storePageCount={storePageCount}
                />
              )}
            </div>
            <StorePanelServiceFilters
              consultOptions={consultServiceFilterOptions}
              consultValue={consultServiceFilters}
              onChange={handleServiceFilterChange}
              providedOptions={providedServiceFilterOptions}
              providedValue={providedServiceFilters}
            />
          </div>
        </div>
      </div>

      {isToastBackdropVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-[990] bg-gray-950/20 transition-opacity"
          aria-hidden="true"
        />
      )}

      {isRouteSearchOverlayVisible && (
        <StorePanelRouteSearchOverlay isRouteLoading={isRouteLoading} />
      )}

      <StorePanelModals
        isLocationPermissionModalOpen={isLocationPermissionModalOpen}
        isLocationRequesting={locationStatus === "requesting"}
        isLoginRequiredModalOpen={isLoginRequiredModalOpen}
        onDismissLocationPermission={dismissLocationPermissionModal}
        onLoginRequiredClose={closeLoginRequiredModal}
        onRequestUserLocation={requestUserLocationFromModal}
        onReservationCancel={cancelReservation}
        onReservationConfirm={handleReservationConfirm}
        reservationStore={reservationStore}
      />
    </div>
  );
};

"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { MapViewport } from "@/features/store/lib/storePanelStores";
import type { useNearbyStores } from "@/features/store/hooks/useNearbyStores";
import type { useServiceFilters } from "@/features/store/hooks/useServiceFilters";
import type { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import type { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import type { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import type { useStoreSearchHistory } from "@/features/store/hooks/useStoreSearchHistory";
import type { useStoreSearchResults } from "@/features/store/hooks/useStoreSearchResults";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import type { useStoreSelectionActions } from "@/features/store/hooks/useStoreSelectionActions";
import type { MapSearchPoint } from "@/features/store/lib/storePanelStores";
import type { StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

/** 마지막 필터 해제 후 매장을 다시 불러오는 동안 지도를 자동으로 옮기지 않는 시간(ms) */
const PIN_AUTO_FIT_SKIP_MS = 2500;

/** 검색 동작 hook(필터·텍스트)이 함께 받는 값. 지도 패널의 상태·다른 hook 결과를 그대로 넘긴다. */
export type StoreSearchActionsParams = Pick<
  ReturnType<typeof useStoreMapState>,
  "searchQuery" | "setSearchQuery"
> &
  Pick<
    ReturnType<typeof useServiceFilters>,
    | "consultServiceFilterOptions"
    | "consultServiceFilters"
    | "filterStoresByServices"
    | "hasActiveServiceFilter"
    | "providedServiceFilterOptions"
    | "providedServiceFilters"
    | "setConsultServiceFilters"
    | "setProvidedServiceFilters"
  > &
  Pick<
    ReturnType<typeof useStoreSearchState>,
    | "areaSearchRequestIdRef"
    | "loadedSearchAreaKeyRef"
    | "loadSearchAreaStores"
    | "mapViewport"
    | "restorePreTagSearchStores"
    | "searchAddedStoreIdsRef"
    | "searchCenter"
    | "searchVisibleArea"
    | "setAllStores"
    | "setMapViewport"
    | "setSubmittedSearchStores"
    | "submittedSearchStores"
    | "updateMapCenter"
  > &
  Pick<
    ReturnType<typeof useStoreSearchResults>,
    "isTagSearchQuery" | "searchedServices"
  > &
  Pick<
    ReturnType<typeof useNearbyStores>,
    "lastNearbyLookupKeyRef" | "nearbyLookup" | "updateStoresByLocation"
  > &
  Pick<ReturnType<typeof useStoreSelectionActions>, "handleStoreSelect"> &
  Pick<
    ReturnType<typeof useStoreRoute>,
    "resetRouteState" | "routeDestinationStoreId"
  > &
  Pick<
    ReturnType<typeof useStorePanelLayout>,
    "setIsSearchHistoryOpen" | "setIsStoreListCollapsed"
  > &
  Pick<ReturnType<typeof useStoreSearchHistory>, "addHistory"> & {
    /** 지금 정보 카드가 떠 있는(또는 길찾기 도착) 매장 */
    mapSelectedStore?: StoreLocation;
    searchInputRef: RefObject<HTMLInputElement | null>;
    searchPoint: MapSearchPoint | null;
    setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
    setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setSoloStoreId: Dispatch<SetStateAction<string>>;
    setStores: Dispatch<SetStateAction<StoreLocation[]>>;
  };

/**
 * 필터 뱃지(태그) 검색: 뱃지 변경, 태그 검색 시작·갱신, 검색어에서 찾은 서비스로 검색, 필터 해제,
 * 뱃지 검색 중 지도를 옮겼을 때 보이는 영역에서 다시 찾기, 텍스트 검색 정리.
 */
export const useStoreFilterSearchActions = ({
  areaSearchRequestIdRef,
  consultServiceFilterOptions,
  consultServiceFilters,
  filterStoresByServices,
  hasActiveServiceFilter,
  isTagSearchQuery,
  lastNearbyLookupKeyRef,
  loadedSearchAreaKeyRef,
  mapSelectedStore,
  mapViewport,
  nearbyLookup,
  providedServiceFilterOptions,
  providedServiceFilters,
  resetRouteState,
  restorePreTagSearchStores,
  routeDestinationStoreId,
  searchAddedStoreIdsRef,
  searchCenter,
  searchQuery,
  searchVisibleArea,
  setAllStores,
  setConsultServiceFilters,
  setHasSelectedStoreInfo,
  setIsSearchHistoryOpen,
  setIsStoreListCollapsed,
  setMapViewport,
  setProvidedServiceFilters,
  setSearchPoint,
  setSearchQuery,
  setSoloStoreId,
  setStores,
  setSubmittedSearchStores,
  submittedSearchStores,
  updateMapCenter,
  updateStoresByLocation,
}: StoreSearchActionsParams) => {
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

  return {
    applyServiceFilterSearch,
    clearServiceFilters,
    clearTextSearchSession,
    handleServiceFilterChange,
    handleViewportChange,
    isPinAutoFitSkippedRef,
    shouldRefreshTagSearchOnIdleRef,
  };
};

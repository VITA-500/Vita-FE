"use client";

import { useMemo } from "react";
import type { useServiceFilters } from "@/features/store/hooks/useServiceFilters";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import {
  matchesStoreSearch,
  type UserLocation,
} from "@/features/store/lib/geo";
import { findServicesInText } from "@/features/store/lib/serviceKeywords";
import {
  buildSearchableStores,
  defaultMapLocation,
  sortStoresByDistance,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import type { MapCategory, StoreLocation } from "@/features/store/types";

type SearchState = ReturnType<typeof useStoreSearchState>;
type ServiceFilters = ReturnType<typeof useServiceFilters>;

type UseStoreSearchResultsParams = Pick<
  SearchState,
  | "allStores"
  | "getTextSearchSortCenter"
  | "isInVisibleArea"
  | "submittedSearchOrigin"
  | "submittedSearchStores"
> &
  Pick<
    ServiceFilters,
    | "consultServiceFilterOptions"
    | "filterStoresByServices"
    | "hasActiveServiceFilter"
    | "providedServiceFilterOptions"
  > & {
    activeMapCategory: MapCategory;
    /** 제휴 혜택 탭에 보여줄 제휴 매장(혜택 뱃지 필터 적용 후) */
    benefitStores: StoreLocation[];
    benefitStoresOrigin: MapSearchPoint | null;
    /** 지금 지도에 불러온 매장(기본 정렬·필터 적용 전 목록은 displayStores) */
    displayStores: StoreLocation[];
    searchQuery: string;
    selectedStore?: StoreLocation;
    stores: StoreLocation[];
    storesOrigin: MapSearchPoint | null;
    userLocation: UserLocation | null;
  };

/**
 * 화면에 보여줄 매장 목록 계산: 카테고리·필터 적용, 검색 드롭다운 결과, 지도 핀·목록 매장(기준 지점에서 가까운 순).
 */
export const useStoreSearchResults = ({
  activeMapCategory,
  allStores,
  benefitStores,
  benefitStoresOrigin,
  consultServiceFilterOptions,
  displayStores,
  filterStoresByServices,
  getTextSearchSortCenter,
  hasActiveServiceFilter,
  isInVisibleArea,
  providedServiceFilterOptions,
  searchQuery,
  selectedStore,
  stores,
  storesOrigin,
  submittedSearchOrigin,
  submittedSearchStores,
  userLocation,
}: UseStoreSearchResultsParams) => {
  const categoryStores =
    activeMapCategory === "store"
      ? filterStoresByServices(stores)
      : benefitStores;
  const categoryDisplayStores =
    activeMapCategory === "store"
      ? filterStoresByServices(displayStores)
      : benefitStores;
  const categorySelectedStore =
    activeMapCategory === "store" || activeMapCategory === "benefit"
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
  // 제휴 혜택 탭은 매장 탭의 검색 결과·상담/서비스 필터와 무관하게 제휴 매장(혜택 뱃지로 거른 목록)만 보여준다.
  // (매장 탭 뱃지 검색 결과가 남아 있어도 제휴 탭 지도에 일반 매장 핀이 섞이지 않도록)
  const unsortedMapStores =
    activeMapCategory === "benefit"
      ? categoryStores
      : submittedSearchStores
        ? filterStoresByServices(submittedSearchStores)
        : hasActiveServiceFilter
          ? categoryDisplayStores
          : categoryStores;
  // 매장 목록·핀 순서(A, B, C…)는 필터 여부와 상관없이 항상 기준 지점에서 가까운 순이다.
  // 기준 지점: Enter 검색 결과면 검색한 순간의 검색 중심, 그 외에는 매장을 조회한 지점.
  // (지도가 움직여 검색 중심이 바뀌어도 순서·거리 표시가 흔들리지 않도록 고정된 지점을 쓴다)
  const storesSortOrigin =
    (activeMapCategory === "benefit" ? benefitStoresOrigin : null) ??
    (activeMapCategory === "store" && submittedSearchStores
      ? submittedSearchOrigin
      : null) ??
    storesOrigin ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  // 목록에 보이는 거리도 같은 기준 지점에서 잰 값으로 맞춰, 순서와 거리 표시가 어긋나지 않게 한다.
  const mapStores = sortStoresByDistance(unsortedMapStores, storesSortOrigin);

  return {
    categoryDisplayStores,
    categorySelectedStore,
    categoryStores,
    isTagSearchQuery,
    mapStores,
    searchableStores,
    searchedServices,
    searchResultStores,
  };
};

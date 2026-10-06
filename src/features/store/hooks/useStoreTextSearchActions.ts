"use client";

import type {
  StoreSearchActionsParams,
  useStoreFilterSearchActions,
} from "@/features/store/hooks/useStoreFilterSearchActions";
import type { StoreSearchHistoryItem } from "@/features/store/hooks/useStoreSearchHistory";
import { showToast } from "@/shared/ui/ToastProvider";

type UseStoreTextSearchActionsParams = StoreSearchActionsParams &
  Pick<
    ReturnType<typeof useStoreFilterSearchActions>,
    "applyServiceFilterSearch" | "clearTextSearchSession"
  >;

/**
 * 텍스트 검색: "이 위치에서 검색", Enter 검색 제출, 검색 결과·기록에서 매장 고르기,
 * 검색어 입력과 드롭다운 열고 닫기.
 */
export const useStoreTextSearchActions = ({
  addHistory: addSearchHistory,
  applyServiceFilterSearch,
  areaSearchRequestIdRef,
  clearTextSearchSession,
  filterStoresByServices,
  handleStoreSelect,
  hasActiveServiceFilter,
  isTagSearchQuery,
  loadSearchAreaStores,
  resetRouteState,
  restorePreTagSearchStores,
  routeDestinationStoreId,
  searchedServices,
  searchInputRef,
  searchPoint,
  searchQuery,
  searchVisibleArea,
  setConsultServiceFilters,
  setHasSelectedStoreInfo,
  setIsSearchHistoryOpen,
  setIsStoreListCollapsed,
  setProvidedServiceFilters,
  setSearchPoint,
  setSearchQuery,
  setSoloStoreId,
  setSubmittedSearchStores,
  updateStoresByLocation,
}: UseStoreTextSearchActionsParams) => {
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

  return {
    handleSearchQueryChange,
    openSearchHistory,
    runStoreSearch,
    searchInCurrentArea,
    selectSearchHistory,
    submitStoreSearch,
    toggleSearchHistoryOnInputMouseDown,
  };
};

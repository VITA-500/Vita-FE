"use client";

import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { StorePanelInfoBubble } from "@/features/store/components/StorePanelInfoBubble";
import { StorePanelModals } from "@/features/store/components/StorePanelModals";
import { StorePanelRouteSearchOverlay } from "@/features/store/components/StorePanelRouteSearchOverlay";
import { StorePanelSearchBar } from "@/features/store/components/StorePanelSearchBar";
import { StorePanelSearchDropdown } from "@/features/store/components/StorePanelSearchDropdown";
import { StorePanelServiceFilters } from "@/features/store/components/StorePanelServiceFilters";
import { StorePanelStoreList } from "@/features/store/components/StorePanelStoreList";
import { useStoreMapPanel } from "@/features/store/hooks/useStoreMapPanel";

type StoreMapPanelProps = {
  onOpenSidebar?: () => void;
};

// 상태와 동작은 useStoreMapPanel(useStoreMapPanelState + useStoreMapPanelActions)에 있고,
// 이 컴포넌트는 지도·검색창·목록·모달 화면 배치만 맡는다.
export const StoreMapPanel = ({ onOpenSidebar }: StoreMapPanelProps) => {
  const {
    activeMapCategory,
    activeStorePage,
    addSearchHistory,
    applyServiceFilterSearch,
    cancelReservation,
    changeRouteMode,
    clearSearchHistory,
    clearServiceFilters,
    closeLoginRequiredModal,
    closeSelectedStoreInfo,
    collapsedSearchRef,
    consultServiceFilterOptions,
    consultServiceFilters,
    currentStorePage,
    dismissLocationPermissionModal,
    firstPageSize,
    focusPoint,
    focusUserLocation,
    getMapPinFitPadding,
    goToStorePage,
    handleReservationConfirm,
    handleReserve,
    handleRouteStart,
    handleSearchQueryChange,
    handleServiceFilterChange,
    handleStoreSelect,
    handleViewportChange,
    hasActiveServiceFilter,
    hasMoreStorePages,
    hasSelectedStoreInfo,
    isLocationPermissionModalOpen,
    isLoginRequiredModalOpen,
    isMapSearchLoading,
    isOtherStoresVisible,
    isPinAutoFitSkippedRef,
    isRouteLoading,
    isRouteSearchOverlayVisible,
    isSearchHistoryEnabled,
    isSearchHistoryOpen,
    isStoreListCollapsed,
    isStorePaginationOn,
    isTagSearchQuery,
    isToastBackdropVisible,
    isWaitingForPinSelection,
    locationStatus,
    mapSelectedStore,
    mapSelectedStoreId,
    mapStores,
    mapStoresKey,
    mapTopBarRef,
    markerColorInfoById,
    markerLabelById,
    openSearchHistory,
    otherMapStores,
    pagedMapStores,
    panelRootRef,
    providedServiceFilterOptions,
    providedServiceFilters,
    removeSearchHistory,
    requestUserLocationFromModal,
    reservationStore,
    routeDestinationStoreId,
    routeLeftInset,
    routeMode,
    routePreview,
    routeResultMessage,
    routeSummary,
    runStoreSearch,
    sameLocationStores,
    searchedServices,
    searchFitTarget,
    searchHistory,
    searchInCurrentArea,
    searchInputRef,
    searchPoint,
    searchQuery,
    searchResultStores,
    selectSearchHistory,
    setActiveMapCategory,
    setIsOtherStoresVisible,
    setIsStoreListCollapsed,
    setRouteMapReadyKey,
    setSearchAnchorSource,
    setSearchPoint,
    shouldRefreshTagSearchOnIdleRef,
    showNearbyStoresAfterRoute,
    showStoreInfoCard,
    showStorePagination,
    soloStore,
    soloStoreId,
    storeListPanelRef,
    storePageCount,
    submitStoreSearch,
    toggleSearchHistoryEnabled,
    toggleSearchHistoryOnInputMouseDown,
    userLocation,
    visibleMapStores,
  } = useStoreMapPanel();

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

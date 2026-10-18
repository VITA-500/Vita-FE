"use client";

import { useRef, useState } from "react";
import { StoreMapPanelMap } from "@/features/store/components/StoreMapPanelMap";
import { StoreMapPanelShells } from "@/features/store/components/StoreMapPanelShells";
import {
  StoreMapPanelStoreListContent,
  StoreMapPanelTopBar,
} from "@/features/store/components/StoreMapPanelControls";
import { StoreMapPanelInfoContent } from "@/features/store/components/StorePanelInfoBubble";
import { useCloseOnOutsideTap } from "@/features/store/hooks/useCloseOnOutsideTap";
import { useElementHeight } from "@/shared/hooks/useElementHeight";
import { useElementWidth } from "@/shared/hooks/useElementWidth";
import { useIsDesktopViewport } from "@/shared/hooks/useIsDesktopViewport";
import { useSavedStoreMapSnapshot } from "@/features/store/hooks/useSavedStoreMapSnapshot";
import { useStoreMapPanel } from "@/features/store/hooks/useStoreMapPanel";
import type { MapFitPadding } from "@/features/store/lib/mapFit";
import type {
  StoreMapPanelContentProps,
  StoreMapPanelProps,
} from "@/features/store/lib/storeMapPanelTypes";

/**
 * 매장 지도 화면.
 * 로그인하러 가기 전에 보던 지도 화면이 보관돼 있으면, 화면을 띄운 뒤 읽어 그 상태로 다시 그린다.
 * (서버에서 그린 HTML과 첫 화면이 달라지지 않도록 저장소는 화면을 띄운 뒤에 읽는다)
 * 채팅 등에서 특정 매장을 열며 들어온 경우(initialAction)는 그 동작을 우선하고 되살리지 않는다.
 */
export const StoreMapPanel = ({
  initialAction,
  onOpenSidebar,
}: StoreMapPanelProps) => {
  const restoredSnapshot = useSavedStoreMapSnapshot(!initialAction);

  return (
    <StoreMapPanelContent
      // 보관한 화면을 읽으면 처음 값부터 다시 시작하도록 새로 그린다.
      key={restoredSnapshot ? `restored:${restoredSnapshot.savedAt}` : "fresh"}
      initialAction={initialAction}
      onOpenSidebar={onOpenSidebar}
      restoredSnapshot={restoredSnapshot}
    />
  );
};

const StoreMapPanelContent = ({
  initialAction,
  onOpenSidebar,
  restoredSnapshot,
}: StoreMapPanelContentProps) => {
  const panel = useStoreMapPanel(initialAction, restoredSnapshot);
  const {
    activeMapCategory,
    activeStorePage,
    addSearchHistory,
    applyServiceFilterSearch,
    benefitCategories,
    benefitServiceFilterOptions,
    benefitServiceFilters,
    cancelReservation,
    changeBenefitCategory,
    changeMapCategory,
    clearBenefitServiceFilters,
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
    getMapPinFitPadding,
    goToStorePage,
    handleReservationConfirm,
    handleReserve,
    handleRouteStart,
    handleSearchQueryChange,
    handleServiceFilterChange,
    handleStoreSelect,
    hasActiveBenefitServiceFilter,
    hasActiveServiceFilter,
    hasMoreStorePages,
    isLocationPermissionModalOpen,
    isLoginRequiredModalOpen,
    isMapSearchLoading,
    isReservationSubmitting,
    isRouteLoading,
    isRouteSearchOverlayVisible,
    isSearchHistoryEnabled,
    isSearchHistoryOpen,
    isStoreListCollapsed,
    isStorePaginationOn,
    isBenefitStoreLoading,
    isTagSearchQuery,
    isToastBackdropVisible,
    isWaitingForPinSelection,
    locationStatus,
    mapSelectedStore,
    mapSelectedStoreId,
    mapStores,
    mapTopBarRef,
    maxReservationDate,
    minReservationDate,
    openFilter,
    openSearchHistory,
    pagedMapStores,
    panelRootRef,
    providedServiceFilterOptions,
    providedServiceFilters,
    removeSearchHistory,
    resetRouteState,
    requestUserLocationFromModal,
    reservationDate,
    reservationStore,
    reservationTime,
    routeDestinationStoreId,
    routeMode,
    routeResultMessage,
    routeSummary,
    runStoreSearch,
    sameLocationStores,
    searchedServices,
    searchHistory,
    searchInputRef,
    searchQuery,
    searchResultStores,
    selectSearchHistory,
    selectedBenefitCategory,
    setBenefitServiceFilters,
    setOpenFilter,
    setIsStoreListCollapsed,
    setReservationDate,
    setReservationTime,
    showNearbyStoresAfterRoute,
    showStoreInfoCard,
    showStorePagination,
    soloStoreId,
    storePageCount,
    submitStoreSearch,
    toggleSearchHistoryEnabled,
    toggleSearchHistoryOnInputMouseDown,
  } = panel;
  const isBenefitCategory = activeMapCategory === "benefit";
  // 지도에서 선택한 매장이 길찾기 도착 매장인지
  const isSelectedStoreRouteTarget = Boolean(
    routeDestinationStoreId && routeDestinationStoreId === mapSelectedStore?.id,
  );

  // 좌측 사이드바(데스크톱) / 바텀 시트(모바일)
  // A(매장 목록)는 isStoreListCollapsed로, B(매장 정보)는 선택 매장 정보 표시 여부로 열고 닫는다.
  // B는 A 오른쪽에 붙어 열리므로, 매장 정보가 보이면 A도 함께 열린 것으로 본다.
  const isDesktop = useIsDesktopViewport();
  const listPanelRef = useRef<HTMLElement>(null);
  const infoPanelRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  // 화면 너비가 바뀌어 사이드바 ↔ 바텀 시트가 바뀌면 새로 그려진 요소를 다시 잰다.
  const listPanelWidth = useElementWidth(listPanelRef, isDesktop);
  const infoPanelWidth = useElementWidth(infoPanelRef, isDesktop);
  const sheetHeight = useElementHeight(sheetRef, isDesktop) ?? 0;
  const isInfoOpen = showStoreInfoCard;
  // 모바일 바텀 시트를 위쪽 검색창 아래까지 펼쳤는지. 길찾기 중 이동수단을 고르면 절반으로 내린다.
  const [isSheetExpandedState, setIsSheetExpanded] = useState(false);
  // 대중교통 경로 구간을 눌렀을 때 지도를 맞출 대상(누를 때마다 key를 올린다)
  const [routeFocusTarget, setRouteFocusTarget] = useState<{
    key: number;
    points: { lat: number; lng: number }[];
  } | null>(null);
  const isListOpen = !isStoreListCollapsed || isInfoOpen;

  // 길찾기 중(데스크톱): B는 A 뒤로 접혀 들어가고, 길찾기 정보는 A 자리에 보여준다.
  const isRouteViewOpen = isDesktop && isInfoOpen && isSelectedStoreRouteTarget;
  const isInfoPanelOpen = isInfoOpen && !isRouteViewOpen;
  useCloseOnOutsideTap({
    isEnabled: isInfoPanelOpen,
    onClose: closeSelectedStoreInfo,
    panelRefs: [infoPanelRef, listPanelRef, sheetRef],
  });
  // 지도에서 사이드바가 덮는 왼쪽 폭(데스크톱) / 바텀 시트가 덮는 아래쪽 높이(모바일)
  const panelLeftInset =
    isDesktop && isListOpen
      ? listPanelWidth + (isInfoPanelOpen ? infoPanelWidth : 0)
      : 0;
  const sheetBottomInset = !isDesktop && isListOpen ? sheetHeight : 0;

  /** 핸들: 바깥쪽 패널부터 하나씩 닫는다(B → A). 모두 닫혀 있으면 A를 연다. */
  const handlePanelHandleClick = () => {
    if (isInfoPanelOpen) {
      closeSelectedStoreInfo();
      setIsStoreListCollapsed(false);
      return;
    }

    // A를 닫는다. 길찾기 정보가 A 자리에 떠 있었다면 그 정보 표시도 함께 닫는다(경로는 지도에 남는다).
    if (isListOpen) {
      closeSelectedStoreInfo();
      setIsStoreListCollapsed(true);
      return;
    }

    setIsStoreListCollapsed(false);
  };
  /** 길찾기 정보 닫기(X): 길찾기를 끝내고, A 뒤로 접혀 있던 매장 정보(B)를 다시 펼친다. */
  const closeRouteView = () => {
    resetRouteState();
    setIsStoreListCollapsed(false);
    // 모바일: 매장 정보 시트를 기본(절반 정도) 높이로 내린다.
    setIsSheetExpanded(false);
  };
  /** 검색창 목록 버튼: 열려 있으면 A·B를 모두 닫고, 닫혀 있으면 A를 연다. */
  const toggleSidePanels = () => {
    if (isListOpen) {
      closeSelectedStoreInfo();
      setIsStoreListCollapsed(true);
      return;
    }

    setIsStoreListCollapsed(false);
  };

  // 핀을 꽂을 때 비워 둘 여백: 열린 사이드바(데스크톱) 오른쪽, 바텀 시트(모바일) 위
  const getPinFitPadding = (container: { height: number; width: number }) => {
    const padding = getMapPinFitPadding(container);

    if (!padding) {
      return null;
    }

    return isDesktop
      ? { ...padding, left: isListOpen ? panelLeftInset + 24 : padding.left }
      : {
          ...padding,
          bottom: Math.max(padding.bottom, sheetBottomInset + 24),
        };
  };
  // 선택한 매장 핀이 보여야 하는 영역. 사이드바·바텀 시트에 가리면 지도를 이 영역 가운데로 옮긴다.
  const selectedPinSafeArea: MapFitPadding | null = !showStoreInfoCard
    ? null
    : isDesktop
      ? { bottom: 56, left: panelLeftInset + 32, right: 96, top: 32 }
      : { bottom: sheetBottomInset + 16, left: 24, right: 24, top: 72 };

  const storeListContent = (
    <StoreMapPanelStoreListContent
      activeMapCategory={activeMapCategory}
      activeStorePage={activeStorePage}
      benefitCategories={benefitCategories}
      benefitServiceFilterOptions={benefitServiceFilterOptions}
      benefitServiceFilters={benefitServiceFilters}
      changeBenefitCategory={changeBenefitCategory}
      changeMapCategory={changeMapCategory}
      closeSelectedStoreInfo={closeSelectedStoreInfo}
      consultServiceFilterOptions={consultServiceFilterOptions}
      consultServiceFilters={consultServiceFilters}
      currentStorePage={currentStorePage}
      firstPageSize={firstPageSize}
      goToStorePage={goToStorePage}
      handleServiceFilterChange={handleServiceFilterChange}
      handleStoreSelect={handleStoreSelect}
      hasMoreStorePages={hasMoreStorePages}
      isBenefitStoreLoading={isBenefitStoreLoading}
      isDesktop={isDesktop}
      isStorePaginationOn={isStorePaginationOn}
      mapSelectedStoreId={mapSelectedStoreId}
      mapStores={mapStores}
      openFilter={openFilter}
      pagedMapStores={pagedMapStores}
      providedServiceFilterOptions={providedServiceFilterOptions}
      providedServiceFilters={providedServiceFilters}
      selectedBenefitCategory={selectedBenefitCategory}
      setBenefitServiceFilters={setBenefitServiceFilters}
      setOpenFilter={setOpenFilter}
      showStorePagination={showStorePagination}
      storePageCount={storePageCount}
    />
  );
  const storeInfoContent = showStoreInfoCard ? (
    <StoreMapPanelInfoContent
      changeRouteMode={changeRouteMode}
      handleReserve={handleReserve}
      handleRouteStart={handleRouteStart}
      handleStoreSelect={handleStoreSelect}
      isBenefitCategory={isBenefitCategory}
      isDesktop={isDesktop}
      isMapSearchLoading={isMapSearchLoading}
      isSelectedStoreRouteTarget={isSelectedStoreRouteTarget}
      isWaitingForPinSelection={isWaitingForPinSelection}
      mapSelectedStore={mapSelectedStore}
      onRouteFocusTargetChange={setRouteFocusTarget}
      onSheetExpandedChange={setIsSheetExpanded}
      routeMode={routeMode}
      routeResultMessage={routeResultMessage}
      routeSummary={routeSummary}
      sameLocationStores={sameLocationStores}
      showNearbyStoresAfterRoute={showNearbyStoresAfterRoute}
      soloStoreId={soloStoreId}
    />
  ) : null;
  const isMobileRouteView =
    !isDesktop && isInfoOpen && isSelectedStoreRouteTarget;
  const isSheetExpanded = isListOpen && isSheetExpandedState;
  const isMobileReservationView = !isDesktop && reservationStore !== null;
  const closeReservationView = () => {
    cancelReservation();
    closeSelectedStoreInfo();
  };

  return (
    <div
      ref={panelRootRef}
      // 모바일은 최소 높이를 두지 않는다. 화면보다 높아지면 바텀 시트 아래쪽(운영시간 등)이 하단 내비게이션 뒤로 잘린다.
      className="relative h-full overflow-hidden md:min-h-[640px]"
    >
      <StoreMapPanelMap
        {...panel}
        getPinFitPadding={getPinFitPadding}
        isBenefitCategory={isBenefitCategory}
        isDesktop={isDesktop}
        isListOpen={isListOpen}
        panelLeftInset={panelLeftInset}
        routeFocusTarget={routeFocusTarget}
        selectedPinSafeArea={selectedPinSafeArea}
        sheetBottomInset={sheetBottomInset}
        showStoreInfoCard={showStoreInfoCard}
      />

      <StoreMapPanelShells
        {...panel}
        cancelReservation={cancelReservation}
        closeLoginRequiredModal={closeLoginRequiredModal}
        closeReservationView={closeReservationView}
        closeRouteView={closeRouteView}
        dismissLocationPermissionModal={dismissLocationPermissionModal}
        handlePanelHandleClick={handlePanelHandleClick}
        handleReservationConfirm={handleReservationConfirm}
        infoPanelRef={infoPanelRef}
        isDesktop={isDesktop}
        isInfoOpen={isInfoOpen}
        isInfoPanelOpen={isInfoPanelOpen}
        isListOpen={isListOpen}
        isLocationPermissionModalOpen={isLocationPermissionModalOpen}
        isLoginRequiredModalOpen={isLoginRequiredModalOpen}
        isMobileReservationView={isMobileReservationView}
        isMobileRouteView={isMobileRouteView}
        isReservationSubmitting={isReservationSubmitting}
        isRouteLoading={isRouteLoading}
        isRouteSearchOverlayVisible={isRouteSearchOverlayVisible}
        isRouteViewOpen={isRouteViewOpen}
        isSheetExpanded={isSheetExpanded}
        isToastBackdropVisible={isToastBackdropVisible}
        listPanelRef={listPanelRef}
        locationStatus={locationStatus}
        maxReservationDate={maxReservationDate}
        minReservationDate={minReservationDate}
        onSheetExpandedChange={setIsSheetExpanded}
        requestUserLocationFromModal={requestUserLocationFromModal}
        reservationDate={reservationDate}
        reservationStore={reservationStore}
        reservationTime={reservationTime}
        setReservationDate={setReservationDate}
        setReservationTime={setReservationTime}
        sheetRef={sheetRef}
        storeInfoContent={storeInfoContent}
        storeListContent={storeListContent}
      />

      <StoreMapPanelTopBar
        activeMapCategory={activeMapCategory}
        addSearchHistory={addSearchHistory}
        applyServiceFilterSearch={applyServiceFilterSearch}
        benefitServiceFilterOptions={benefitServiceFilterOptions}
        benefitServiceFilters={benefitServiceFilters}
        clearBenefitServiceFilters={clearBenefitServiceFilters}
        clearSearchHistory={clearSearchHistory}
        clearServiceFilters={clearServiceFilters}
        closeSelectedStoreInfo={closeSelectedStoreInfo}
        collapsedSearchRef={collapsedSearchRef}
        consultServiceFilterOptions={consultServiceFilterOptions}
        consultServiceFilters={consultServiceFilters}
        handleSearchQueryChange={handleSearchQueryChange}
        handleServiceFilterChange={handleServiceFilterChange}
        hasActiveBenefitServiceFilter={hasActiveBenefitServiceFilter}
        hasActiveServiceFilter={hasActiveServiceFilter}
        hasMoreStorePages={hasMoreStorePages}
        isDesktop={isDesktop}
        isListOpen={isListOpen}
        isSearchHistoryEnabled={isSearchHistoryEnabled}
        isSearchHistoryOpen={isSearchHistoryOpen}
        isTagSearchQuery={isTagSearchQuery}
        mapStores={mapStores}
        mapTopBarRef={mapTopBarRef}
        onOpenSidebar={onOpenSidebar}
        onToggleStoreList={toggleSidePanels}
        openSearchHistory={openSearchHistory}
        pagedMapStores={pagedMapStores}
        providedServiceFilterOptions={providedServiceFilterOptions}
        providedServiceFilters={providedServiceFilters}
        removeSearchHistory={removeSearchHistory}
        runStoreSearch={runStoreSearch}
        searchedServices={searchedServices}
        searchHistory={searchHistory}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        searchResultStores={searchResultStores}
        selectSearchHistory={selectSearchHistory}
        setBenefitServiceFilters={setBenefitServiceFilters}
        submitStoreSearch={submitStoreSearch}
        toggleSearchHistoryEnabled={toggleSearchHistoryEnabled}
        toggleSearchHistoryOnInputMouseDown={
          toggleSearchHistoryOnInputMouseDown
        }
      />
    </div>
  );
};

"use client";

import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import type { StoreMapPanelModel } from "@/features/store/hooks/useStoreMapPanel";
import type { MapFitPadding } from "@/features/store/lib/mapFit";

type StoreMapPanelMapProps = Pick<
  StoreMapPanelModel,
  | "currentStorePage"
  | "focusPoint"
  | "focusUserLocation"
  | "handleStoreSelect"
  | "handleViewportChange"
  | "hasActiveServiceFilter"
  | "hasSelectedStoreInfo"
  | "isMapSearchLoading"
  | "isOtherStoresVisible"
  | "isPinAutoFitSkippedRef"
  | "isTagSearchQuery"
  | "locationStatus"
  | "mapSelectedStore"
  | "mapSelectedStoreId"
  | "mapStoresKey"
  | "markerColorInfoById"
  | "markerLabelById"
  | "otherMapStores"
  | "routeDestinationStoreId"
  | "routeLeftInset"
  | "routePreview"
  | "searchFitTarget"
  | "searchInCurrentArea"
  | "searchPoint"
  | "setIsOtherStoresVisible"
  | "setRouteMapReadyKey"
  | "setSearchAnchorSource"
  | "setSearchPoint"
  | "shouldRefreshTagSearchOnIdleRef"
  | "visibleMapStores"
> & {
  getPinFitPadding: (container: {
    height: number;
    width: number;
  }) => MapFitPadding | null;
  isBenefitCategory: boolean;
  isDesktop: boolean;
  isListOpen: boolean;
  panelLeftInset: number;
  routeFocusTarget: {
    key: number;
    points: { lat: number; lng: number }[];
  } | null;
  selectedPinSafeArea: MapFitPadding | null;
  sheetBottomInset: number;
  showStoreInfoCard: boolean;
  soloStore: StoreMapPanelModel["soloStore"];
  userLocation: StoreMapPanelModel["userLocation"];
  closeSelectedStoreInfo: StoreMapPanelModel["closeSelectedStoreInfo"];
};

export const StoreMapPanelMap = ({
  closeSelectedStoreInfo,
  currentStorePage,
  focusPoint,
  focusUserLocation,
  getPinFitPadding,
  handleStoreSelect,
  handleViewportChange,
  hasActiveServiceFilter,
  hasSelectedStoreInfo,
  isBenefitCategory,
  isDesktop,
  isListOpen,
  isMapSearchLoading,
  isOtherStoresVisible,
  isPinAutoFitSkippedRef,
  isTagSearchQuery,
  locationStatus,
  mapSelectedStore,
  mapSelectedStoreId,
  mapStoresKey,
  markerColorInfoById,
  markerLabelById,
  otherMapStores,
  panelLeftInset,
  routeDestinationStoreId,
  routeFocusTarget,
  routeLeftInset,
  routePreview,
  searchFitTarget,
  searchInCurrentArea,
  searchPoint,
  selectedPinSafeArea,
  setIsOtherStoresVisible,
  setRouteMapReadyKey,
  setSearchAnchorSource,
  setSearchPoint,
  sheetBottomInset,
  shouldRefreshTagSearchOnIdleRef,
  showStoreInfoCard,
  soloStore,
  userLocation,
  visibleMapStores,
}: StoreMapPanelMapProps) => (
  <StoreMapPreview
    className="absolute inset-0"
    focusPoint={focusPoint}
    fitTarget={searchFitTarget}
    markerEnterKey={`${currentStorePage}:${mapStoresKey}`}
    getPinFitPadding={getPinFitPadding}
    pinAutoFitKey={`${mapStoresKey}|${isDesktop ? panelLeftInset : sheetBottomInset}`}
    isPinAutoFitPaused={Boolean(
      routeDestinationStoreId || soloStore || hasSelectedStoreInfo,
    )}
    shouldSkipPinAutoFit={() => isPinAutoFitSkippedRef.current}
    isFullBleed
    isSearchFromMapPointLoading={isMapSearchLoading}
    routePreview={routePreview}
    onRouteMapReady={setRouteMapReadyKey}
    selectedStore={showStoreInfoCard ? mapSelectedStore : undefined}
    selectedPinSafeArea={selectedPinSafeArea}
    overlayInset={{ bottom: sheetBottomInset, left: panelLeftInset }}
    routeFocusTarget={routeFocusTarget}
    routeLeftInset={isDesktop && isListOpen ? panelLeftInset : routeLeftInset}
    selectedStoreId={showStoreInfoCard ? mapSelectedStoreId : ""}
    stores={visibleMapStores}
    markerLabelById={markerLabelById}
    markerColorInfoById={markerColorInfoById}
    searchPoint={searchPoint}
    userLocation={userLocation}
    isUserLocationLoading={locationStatus === "requesting"}
    onFocusUserLocation={focusUserLocation}
    onMapPointSelect={(point) => {
      setSearchPoint(point);
      shouldRefreshTagSearchOnIdleRef.current =
        !isBenefitCategory && isTagSearchQuery && hasActiveServiceFilter;
      setSearchAnchorSource("map");
    }}
    onViewportChange={handleViewportChange}
    onSearchFromMapPoint={() => {
      closeSelectedStoreInfo();
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
);

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
  | "hasSelectedStoreInfo"
  | "initialMapLevel"
  | "isMapSearchLoading"
  | "isOtherStoresVisible"
  | "cameraOwnerRef"
  | "locationStatus"
  | "mapSelectedStore"
  | "mapSelectedStoreId"
  | "mapStoresKey"
  | "markerColorInfoById"
  | "markerLabelById"
  | "otherMapStores"
  | "refreshTagSearchAfterDrag"
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
  | "setCameraOwner"
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
  hasSelectedStoreInfo,
  initialMapLevel,
  isBenefitCategory,
  isDesktop,
  isListOpen,
  isMapSearchLoading,
  isOtherStoresVisible,
  cameraOwnerRef,
  locationStatus,
  mapSelectedStore,
  mapSelectedStoreId,
  mapStoresKey,
  markerColorInfoById,
  markerLabelById,
  otherMapStores,
  panelLeftInset,
  refreshTagSearchAfterDrag,
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
  setCameraOwner,
  showStoreInfoCard,
  soloStore,
  userLocation,
  visibleMapStores,
}: StoreMapPanelMapProps) => (
  <StoreMapPreview
    className="absolute inset-0"
    focusPoint={focusPoint}
    initialLevel={initialMapLevel}
    fitTarget={searchFitTarget}
    markerEnterKey={`${currentStorePage}:${mapStoresKey}`}
    getPinFitPadding={getPinFitPadding}
    pinAutoFitKey={`${mapStoresKey}|${isDesktop ? panelLeftInset : sheetBottomInset}`}
    isPinAutoFitPaused={Boolean(
      routeDestinationStoreId || soloStore || hasSelectedStoreInfo,
    )}
    cameraOwnerRef={cameraOwnerRef}
    onUserCameraControl={() => setCameraOwner("user")}
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
    onMapPointSelect={(point, viewport) => {
      setCameraOwner("user");
      setSearchAnchorSource("map");

      // 뱃지(카테고리) 검색 중이면 옮긴 영역에서 바로 다시 찾고, 아니면 "이 지역에서 재검색" 버튼을 띄운다.
      // 매장 정보를 보고 있는 중이면 목록이 바뀌지 않도록 자동으로 찾지 않고 버튼만 띄운다.
      if (
        !isBenefitCategory &&
        !showStoreInfoCard &&
        viewport &&
        refreshTagSearchAfterDrag(viewport)
      ) {
        return;
      }

      setSearchPoint(point);
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

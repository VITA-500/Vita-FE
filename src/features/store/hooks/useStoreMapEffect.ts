"use client";

import { useEffect } from "react";
import { setupStoreMap } from "@/features/store/lib/storeMapCamera";
import { createSelectedStoreCardController } from "@/features/store/lib/storeMapCardController";
import { bindStoreMapEvents } from "@/features/store/lib/storeMapEvents";
import { drawStoreMarkers } from "@/features/store/lib/storeMapMarkers";
import type {
  StoreMapEffectContext,
  StoreMapPreviewProps,
} from "@/features/store/lib/storeMapPreviewTypes";

type UseStoreMapEffectParams = StoreMapEffectContext &
  Pick<StoreMapPreviewProps, "onSearchFromMapPoint"> & {
    /** 정보 카드 크기가 바뀔 때마다 올라가는 key(카드 위치를 다시 계산) */
    selectedStoreCardLayoutKey: number;
  };

/**
 * 지도 메인 effect. 값이 바뀔 때마다 지도 생성·초점 → 카드 위치 계산 준비 → 지도 이벤트 연결 → 핀 그리기를
 * 한 번에 다시 실행하고, 정리할 때 이벤트와 핀을 함께 걷는다. (각 단계는 lib/storeMap*.ts의 함수)
 */
export const useStoreMapEffect = ({
  animatedMarkerEnterKeyRef,
  autoFitCardAfterZoomRef,
  ensuredCardStoreIdRef,
  fittedRouteKeyRef,
  focusPoint,
  focusPointRef,
  getRouteObstacleRect,
  isKakaoMapReady,
  isRouteCardDocked,
  isRouteCardHeld,
  lastMarkerClickAtRef,
  mapContainerRef,
  mapRef,
  markerColorInfoById,
  markerEnterKey,
  markerLabelById,
  markRouteFitReadyRef,
  onCenterChange,
  onMapPointSelect,
  onRouteObstructed,
  onSearchFromMapPoint,
  onSelectedStoreCardClose,
  onSelectStore,
  onViewportChange,
  overlayRefs,
  pendingRevealStoreIdRef,
  pendingRouteFitKeyRef,
  revealedCardStoreId,
  revealFallbackTimeoutRef,
  routeFitFallbackTimeoutRef,
  routeLeftInset,
  routePreview,
  routePreviewRef,
  searchPoint,
  searchPointRef,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLayoutKey,
  selectedStoreCardLeftInset,
  selectedStoreCardRef,
  selectedStoreId,
  setIsMapFirstPainted,
  setRevealedCardStoreId,
  setSelectedStoreCardPosition,
  stores,
  userLocation,
}: UseStoreMapEffectParams) => {
  useEffect(() => {
    const context = {
      animatedMarkerEnterKeyRef,
      autoFitCardAfterZoomRef,
      ensuredCardStoreIdRef,
      fittedRouteKeyRef,
      focusPoint,
      focusPointRef,
      getRouteObstacleRect,
      isKakaoMapReady,
      isRouteCardDocked,
      isRouteCardHeld,
      lastMarkerClickAtRef,
      mapContainerRef,
      mapRef,
      markerColorInfoById,
      markerEnterKey,
      markerLabelById,
      markRouteFitReadyRef,
      onCenterChange,
      onMapPointSelect,
      onRouteObstructed,
      onSelectedStoreCardClose,
      onSelectStore,
      onViewportChange,
      overlayRefs,
      pendingRevealStoreIdRef,
      pendingRouteFitKeyRef,
      revealedCardStoreId,
      revealFallbackTimeoutRef,
      routeFitFallbackTimeoutRef,
      routeLeftInset,
      routePreview,
      routePreviewRef,
      searchPoint,
      searchPointRef,
      selectedStore,
      selectedStoreCard,
      selectedStoreCardLeftInset,
      selectedStoreCardRef,
      selectedStoreId,
      setIsMapFirstPainted,
      setRevealedCardStoreId,
      setSelectedStoreCardPosition,
      stores,
      userLocation,
    };
    const mapInstance = setupStoreMap(context);

    if (!mapInstance) {
      return;
    }

    const card = createSelectedStoreCardController({
      ...context,
      ...mapInstance,
    });
    const unbindMapEvents = bindStoreMapEvents({
      ...context,
      ...mapInstance,
      ...card,
    });

    drawStoreMarkers({ ...context, ...mapInstance });

    if (!selectedStore || !selectedStoreCard) {
      ensuredCardStoreIdRef.current = "";
      pendingRevealStoreIdRef.current = "";
    }

    window.setTimeout(card.updateSelectedStoreCardPosition);
    // 카드가 그려져 실제 높이를 잴 수 있게 된 뒤에 초점 보정 여부를 판단한다.
    const ensureTimeoutId = window.setTimeout(
      card.ensureSelectedStoreInView,
      60,
    );

    return () => {
      window.clearTimeout(ensureTimeoutId);
      unbindMapEvents();

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
    // markRouteFitReadyRef·pendingRouteFitKeyRef·routeFitFallbackTimeoutRef는 useRouteDrawing의 ref라 항상 같은 값이다.
    // ref·setter(…Ref, set…)는 컴포넌트에서 넘겨받지만 항상 같은 값이라, 의존성에 넣어도 다시 실행되는 시점은 기존과 같다.
  }, [
    focusPoint,
    isKakaoMapReady,
    markRouteFitReadyRef,
    pendingRouteFitKeyRef,
    routeFitFallbackTimeoutRef,
    isRouteCardDocked,
    isRouteCardHeld,
    revealedCardStoreId,
    onSelectStore,
    onMapPointSelect,
    onCenterChange,
    onViewportChange,
    markerLabelById,
    markerEnterKey,
    getRouteObstacleRect,
    markerColorInfoById,
    onRouteObstructed,
    onSelectedStoreCardClose,
    onSearchFromMapPoint,
    routePreview,
    selectedStore,
    selectedStoreCard,
    selectedStoreCardLayoutKey,
    selectedStoreCardLeftInset,
    routeLeftInset,
    selectedStoreId,
    searchPoint,
    stores,
    userLocation,
    animatedMarkerEnterKeyRef,
    autoFitCardAfterZoomRef,
    ensuredCardStoreIdRef,
    fittedRouteKeyRef,
    focusPointRef,
    lastMarkerClickAtRef,
    mapContainerRef,
    mapRef,
    overlayRefs,
    pendingRevealStoreIdRef,
    revealFallbackTimeoutRef,
    routePreviewRef,
    searchPointRef,
    selectedStoreCardRef,
    setIsMapFirstPainted,
    setRevealedCardStoreId,
    setSelectedStoreCardPosition,
  ]);
};

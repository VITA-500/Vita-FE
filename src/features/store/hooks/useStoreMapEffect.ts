"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { setupStoreMap } from "@/features/store/lib/storeMapCamera";
import { createSelectedStoreCardController } from "@/features/store/lib/storeMapCardController";
import {
  bindStoreMapEvents,
  type StoreMapEventContext,
} from "@/features/store/lib/storeMapEvents";
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
 * 지도 effect 두 개.
 * - 그리기: 값이 바뀔 때마다 지도 생성·초점 → 카드 위치 계산 준비 → 핀 그리기를 다시 실행하고, 정리할 때 핀을 걷는다.
 * - 이벤트: 지도가 준비되면 한 번만 연결하고, 이벤트가 일어날 때 최신 값(콜백·선택 매장·카드 controller)을 읽는다.
 *   예전에는 콜백이 바뀔 때마다 그리기 전체와 이벤트 연결을 다시 했다.
 * (각 단계는 lib/storeMap*.ts의 함수)
 */
export const useStoreMapEffect = ({
  animatedMarkerEnterKeyRef,
  autoFitCardAfterZoomRef,
  ensuredCardStoreIdRef,
  fittedRouteKeyRef,
  focusPoint,
  focusPointRef,
  getRouteObstacleRect,
  initialLevel,
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
  onUserCameraControl,
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
  routeBottomInset,
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
  originPoint,
}: UseStoreMapEffectParams) => {
  // 그리기 effect가 만든 최신 카드 controller. 이벤트는 이 값을 이벤트 시점에 읽는다.
  const cardControllerRef = useRef<ReturnType<
    typeof createSelectedStoreCardController
  > | null>(null);
  const eventContextRef = useRef<Omit<StoreMapEventContext, "card"> | null>(
    null,
  );

  // 매 렌더 뒤(화면에 그리기 전) 이벤트가 읽을 최신 값을 맞춰 둔다.
  useLayoutEffect(() => {
    eventContextRef.current = {
      autoFitCardAfterZoomRef,
      getRouteObstacleRect,
      isRouteCardDocked,
      lastMarkerClickAtRef,
      mapContainerRef,
      markRouteFitReadyRef,
      onCenterChange,
      onMapPointSelect,
      onRouteObstructed,
      onSelectedStoreCardClose,
      onUserCameraControl,
      onViewportChange,
      pendingRouteFitKeyRef,
      revealedCardStoreId,
      routePreview,
      selectedStore,
      selectedStoreCardRef,
    };
  });

  useEffect(() => {
    // 지도 이벤트 전용 콜백은 아래 이벤트 effect가 eventContextRef로 읽는다.
    const context = {
      animatedMarkerEnterKeyRef,
      autoFitCardAfterZoomRef,
      ensuredCardStoreIdRef,
      fittedRouteKeyRef,
      focusPoint,
      focusPointRef,
      initialLevel,
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
      onSelectStore,
      overlayRefs,
      pendingRevealStoreIdRef,
      pendingRouteFitKeyRef,
      revealedCardStoreId,
      revealFallbackTimeoutRef,
      routeFitFallbackTimeoutRef,
      routeLeftInset,
      routeBottomInset,
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
      originPoint,
    };
    const mapInstance = setupStoreMap(context);

    if (!mapInstance) {
      return;
    }

    const card = createSelectedStoreCardController({
      ...context,
      ...mapInstance,
    });

    cardControllerRef.current = card;

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
      cardControllerRef.current = null;

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
    // 지도 이벤트에서만 쓰는 콜백(onMapPointSelect·onCenterChange 등)은 이벤트 effect가 최신 값을 읽으므로 넣지 않는다.
    // markRouteFitReadyRef·pendingRouteFitKeyRef·routeFitFallbackTimeoutRef는 useRouteDrawing의 ref라 항상 같은 값이다.
    // ref·setter(…Ref, set…)는 컴포넌트에서 넘겨받지만 항상 같은 값이라, 의존성에 넣어도 다시 실행되는 시점은 기존과 같다.
  }, [
    focusPoint,
    initialLevel,
    isKakaoMapReady,
    markRouteFitReadyRef,
    pendingRouteFitKeyRef,
    routeFitFallbackTimeoutRef,
    isRouteCardDocked,
    isRouteCardHeld,
    revealedCardStoreId,
    onSelectStore,
    markerLabelById,
    markerEnterKey,
    markerColorInfoById,
    routePreview,
    selectedStore,
    selectedStoreCard,
    selectedStoreCardLayoutKey,
    selectedStoreCardLeftInset,
    routeLeftInset,
    routeBottomInset,
    selectedStoreId,
    searchPoint,
    stores,
    userLocation,
    originPoint,
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

  // 지도 이벤트: 지도가 준비되면 한 번 연결한다(그리기 effect가 먼저 실행돼 지도를 만든다).
  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;

    if (!isKakaoMapReady || !map || !kakaoMaps) {
      return;
    }

    return bindStoreMapEvents({
      getContext: () => ({
        ...eventContextRef.current!,
        card: cardControllerRef.current,
      }),
      kakaoMaps,
      map,
    });
  }, [isKakaoMapReady, mapRef]);
};

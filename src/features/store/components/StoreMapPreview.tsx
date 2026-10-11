"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  StoreMapFallbackBackground,
  StoreMapFallbackGlow,
  StoreMapLoadingOverlay,
} from "@/features/store/components/StoreMapBackdrop";
import { StoreMapControls } from "@/features/store/components/StoreMapControls";
import { StoreMapFallbackMarkers } from "@/features/store/components/StoreMapFallbackMarkers";
import { StoreMapSearchAreaButton } from "@/features/store/components/StoreMapSearchAreaButton";
import { StoreMapSelectedCard } from "@/features/store/components/StoreMapSelectedCard";
import { useElementResizeKey } from "@/features/store/hooks/useElementResizeKey";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import { useMapFitTarget } from "@/features/store/hooks/useMapFitTarget";
import { useMapLoadingVisible } from "@/features/store/hooks/useMapLoadingVisible";
import { useMapZoom } from "@/features/store/hooks/useMapZoom";
import { useOtherStoreOverlays } from "@/features/store/hooks/useOtherStoreOverlays";
import { useRouteDrawing } from "@/features/store/hooks/useRouteDrawing";
import { useRouteOverlays } from "@/features/store/hooks/useRouteOverlays";
import { useRouteRefocus } from "@/features/store/hooks/useRouteRefocus";
import { useStoreMapEffect } from "@/features/store/hooks/useStoreMapEffect";
import type { MapOverlayHandle } from "@/features/store/lib/kakaoMapTypes";
import type { MapPoint } from "@/features/store/lib/mapFit";
import type { RoutePreview } from "@/features/store/lib/mapRoute";
import { getFallbackMarkerStyle } from "@/features/store/lib/storeMapFallbackLayout";
import type { StoreMapPreviewProps } from "@/features/store/lib/storeMapPreviewTypes";
import { cn } from "@/shared/lib/cn";

export type { MapFitPadding } from "@/features/store/lib/mapFit";

type SearchPointRef = MapPoint | null | undefined;
type FocusPointRef = MapPoint | null | undefined;
type RoutePreviewRef = RoutePreview | null | undefined;

// 카카오맵 overlay는 React 렌더링 밖의 DOM을 직접 다루므로 lifecycle 정리가 중요하다.
// 마커/경로/카드 동작을 바꿀 때는 cleanup effect가 같이 따라가는지 확인한다.
export const StoreMapPreview = ({
  className,
  focusPoint,
  isCompact = false,
  isFullBleed = false,
  isRouteCardDocked = false,
  isSearchFromMapPointLoading = false,
  onSelectStore,
  onRouteMapReady,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLeftInset = 0,
  routeLeftInset = 0,
  selectedStoreId,
  searchPoint,
  routePreview,
  stores,
  userLocation,
  isUserLocationLoading = false,
  onFocusUserLocation,
  onMapPointSelect,
  onCenterChange,
  onViewportChange,
  markerLabelById,
  markerColorInfoById,
  otherStores = [],
  otherStoreCount = 0,
  isOtherStoresVisible = false,
  onToggleOtherStores,
  getRouteObstacleRect,
  onRouteObstructed,
  fitTarget,
  markerEnterKey = "",
  getPinFitPadding,
  pinAutoFitKey = "",
  isPinAutoFitPaused = false,
  shouldSkipPinAutoFit,
  onSelectedStoreCardClose,
  onSearchFromMapPoint,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();
  // 지도가 처음 화면에 그려졌는지. 그 전(SDK 로딩, 내 위치·매장 기준점 대기, 타일 로딩)에는
  // 빈 화면 대신 로딩 화면을 보여준다.
  const [isMapFirstPainted, setIsMapFirstPainted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<MapOverlayHandle[]>([]);
  // 핀 등장 애니메이션을 마지막으로 재생한 key(같은 key로 다시 그릴 때는 재생하지 않음)
  const animatedMarkerEnterKeyRef = useRef("");
  const otherStoresRef = useRef(otherStores);
  const storesRef = useRef(stores);
  const getPinFitPaddingRef = useRef(getPinFitPadding);
  const isPinAutoFitPausedRef = useRef(isPinAutoFitPaused);
  const shouldSkipPinAutoFitRef = useRef(shouldSkipPinAutoFit);
  const routeLeftInsetRef = useRef(routeLeftInset);
  const onSelectStoreRef = useRef(onSelectStore);
  const selectedStoreCardRef = useRef<HTMLDivElement | null>(null);
  const [selectedStoreCardPosition, setSelectedStoreCardPosition] =
    useState<CSSProperties | null>(null);
  const fittedRouteKeyRef = useRef("");
  // 핀 클릭 시각(핀 클릭이 지도 click으로 이어져 카드가 바로 닫히는 것을 막는 데 사용)
  const lastMarkerClickAtRef = useRef(0);
  // 확대/축소 버튼 직후에만 카드 위치 자동 보정(지도 밀기)을 하기 위한 표시
  const autoFitCardAfterZoomRef = useRef(false);

  // 카드가 보이도록 초점 보정을 마친 매장 id (같은 매장에 대해 반복 보정하지 않도록)
  const ensuredCardStoreIdRef = useRef("");
  // 초점 이동이 끝나면 카드를 보여줄 매장 id / 실제로 카드를 보여주고 있는 매장 id
  const pendingRevealStoreIdRef = useRef("");
  const revealFallbackTimeoutRef = useRef<number | undefined>(undefined);
  const [revealedCardStoreId, setRevealedCardStoreId] = useState("");

  useEffect(
    () => () => {
      window.clearTimeout(revealFallbackTimeoutRef.current);
    },
    [],
  );
  const focusPointRef = useRef<FocusPointRef>(undefined);
  const searchPointRef = useRef<SearchPointRef>(undefined);
  const routePreviewRef = useRef<RoutePreviewRef>(undefined);

  // 카드 크기가 바뀌면(내용 변경 등) 카드 위치를 다시 계산하도록 key를 올린다.
  const selectedStoreCardLayoutKey = useElementResizeKey(
    selectedStoreCardRef,
    selectedStoreCard,
  );

  const { adjustZoomLevel, isMapAnimating } = useMapZoom({
    autoFitCardAfterZoomRef,
    mapContainerRef,
    mapRef,
    routeLeftInset,
    routePreview,
    selectedStore,
    selectedStoreCard,
    selectedStoreCardLeftInset,
    selectedStoreCardRef,
  });

  const {
    isRouteCardHeld,
    markRouteFitReadyRef,
    pendingRouteFitKeyRef,
    routeDrawProgress,
    routeFitFallbackTimeoutRef,
    routeFitReadyKey,
  } = useRouteDrawing({
    fittedRouteKeyRef,
    isKakaoMapReady,
    onRouteMapReady,
    routePreview,
  });

  useStoreMapEffect({
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
  });

  useEffect(() => {
    otherStoresRef.current = otherStores;
    onSelectStoreRef.current = onSelectStore;
    storesRef.current = stores;
    getPinFitPaddingRef.current = getPinFitPadding;
    isPinAutoFitPausedRef.current = isPinAutoFitPaused;
    shouldSkipPinAutoFitRef.current = shouldSkipPinAutoFit;
    routeLeftInsetRef.current = routeLeftInset;
  });

  useOtherStoreOverlays({
    isKakaoMapReady,
    lastMarkerClickAtRef,
    mapRef,
    onSelectStoreRef,
    otherStores,
    otherStoresRef,
    setRevealedCardStoreId,
  });

  useRouteRefocus({
    mapContainerRef,
    mapRef,
    routeDrawProgress,
    routeLeftInset,
    routePreview,
    selectedStoreCard,
    selectedStoreCardLeftInset,
    selectedStoreCardRef,
  });

  useMapFitTarget({
    fitTarget,
    getPinFitPaddingRef,
    isKakaoMapReady,
    isPinAutoFitPausedRef,
    mapContainerRef,
    mapRef,
    pinAutoFitKey,
    routeLeftInset,
    routeLeftInsetRef,
    shouldSkipPinAutoFitRef,
    storesRef,
  });

  useRouteOverlays({
    isKakaoMapReady,
    mapRef,
    routeDrawProgress,
    routeFitReadyKey,
    routePreview,
  });

  const isMapLoadingVisible = useMapLoadingVisible({
    isKakaoMapReady,
    isMapFirstPainted,
  });

  return (
    <section
      data-kakao-map-ready={isKakaoMapReady}
      aria-busy={isMapLoadingVisible || undefined}
      className={cn(
        "relative overflow-hidden bg-white dark:bg-zinc-950",
        isFullBleed
          ? "h-full"
          : "border-border rounded-3xl border shadow-sm dark:border-white/10",
        className,
      )}
    >
      {isKakaoMapReady ? (
        <div ref={mapContainerRef} className="absolute inset-0" />
      ) : (
        <StoreMapFallbackBackground />
      )}

      <StoreMapLoadingOverlay isVisible={isMapLoadingVisible} />

      <div
        className={cn(
          "pointer-events-none relative h-full",
          isCompact ? "p-3" : "min-h-[420px] p-5 sm:p-7",
        )}
      >
        {!isKakaoMapReady && <StoreMapFallbackGlow />}

        {!isKakaoMapReady && (
          <StoreMapFallbackMarkers
            markerColorInfoById={markerColorInfoById}
            markerLabelById={markerLabelById}
            onSelectStore={onSelectStore}
            selectedStoreId={selectedStoreId}
            stores={stores}
          />
        )}

        <StoreMapControls
          isCompact={isCompact}
          hasUserLocation={Boolean(userLocation)}
          isOtherStoresVisible={isOtherStoresVisible}
          isUserLocationLoading={isUserLocationLoading}
          onFocusUserLocation={onFocusUserLocation}
          onToggleOtherStores={onToggleOtherStores}
          onZoom={adjustZoomLevel}
          otherStoreCount={otherStoreCount}
        />

        {/*
          카드 바깥 클릭으로 닫기는 지도 자체의 click 이벤트로 처리한다.
          (예전처럼 지도 전체를 덮는 투명 버튼을 두면 지도를 끌 수 없고 손바닥 커서도 뜨지 않는다)
        */}

        {selectedStore &&
          selectedStoreCard &&
          (selectedStoreCardPosition || !isKakaoMapReady) && (
            <StoreMapSelectedCard
              cardRef={selectedStoreCardRef}
              isMapAnimating={isMapAnimating}
              isRevealed={revealedCardStoreId === selectedStore.id}
              isRouteCardDocked={isRouteCardDocked}
              isRouteCardHeld={isRouteCardHeld}
              style={
                selectedStoreCardPosition ??
                getFallbackMarkerStyle(
                  selectedStore,
                  stores,
                  stores.findIndex((store) => store.id === selectedStore.id),
                )
              }
            >
              {selectedStoreCard}
            </StoreMapSelectedCard>
          )}

        {searchPoint && onSearchFromMapPoint && (
          <StoreMapSearchAreaButton
            isLoading={isSearchFromMapPointLoading}
            onClick={() => {
              onSelectedStoreCardClose?.();
              onSearchFromMapPoint();
            }}
          />
        )}
      </div>
    </section>
  );
};

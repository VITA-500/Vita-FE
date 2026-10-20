"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  StoreMapFallbackBackground,
  StoreMapFallbackGlow,
  StoreMapLoadingOverlay,
} from "@/features/store/map/components/StoreMapBackdrop";
import { StoreMapControls } from "@/features/store/map/components/StoreMapControls";
import { StoreMapFallbackMarkers } from "@/features/store/map/components/StoreMapFallbackMarkers";
import { StoreMapSearchAreaButton } from "@/features/store/map/components/StoreMapSearchAreaButton";
import { StoreMapSelectedCard } from "@/features/store/map/components/StoreMapSelectedCard";
import { useElementResizeKey } from "@/shared/hooks/useElementResizeKey";
import { useKakaoMapReady } from "@/shared/hooks/useKakaoMapReady";
import { useKeepSelectedCardInView } from "@/features/store/map/hooks/useKeepSelectedCardInView";
import { useKeepSelectedPinVisible } from "@/features/store/map/hooks/useKeepSelectedPinVisible";
import { useMapFitTarget } from "@/features/store/map/hooks/useMapFitTarget";
import { useMapLoadingVisible } from "@/features/store/map/hooks/useMapLoadingVisible";
import { useMapZoom } from "@/features/store/map/hooks/useMapZoom";
import { useOtherStoreOverlays } from "@/features/store/map/hooks/useOtherStoreOverlays";
import { useRouteDrawing } from "@/features/store/route/hooks/useRouteDrawing";
import { useRouteOverlays } from "@/features/store/route/hooks/useRouteOverlays";
import { useRouteRefocus } from "@/features/store/route/hooks/useRouteRefocus";
import { useRouteViewportEffects } from "@/features/store/route/hooks/useRouteViewportEffects";
import { useStoreMapEffect } from "@/features/store/map/hooks/useStoreMapEffect";
import type { MapOverlayHandle } from "@/shared/lib/kakaoMapTypes";
import { getFallbackMarkerStyle } from "@/features/store/map/lib/storeMapFallbackLayout";
import {
  STORE_MAP_CARD_RESIZE_SETTLE_MS,
  type FocusPointRef,
  type RoutePreviewRef,
  type SearchPointRef,
  type StoreMapPreviewProps,
} from "@/features/store/map/lib/storeMapPreviewTypes";
import { cn } from "@/shared/lib/cn";

export type { MapFitPadding } from "@/features/store/map/lib/mapFit";

/** 카드 크기 변화가 이 시간(ms) 동안 멈춘 뒤에 위치를 다시 계산한다. */
// 카카오맵 overlay는 React 렌더링 밖의 DOM을 직접 다루므로 lifecycle 정리가 중요하다.
// 마커/경로/카드 동작을 바꿀 때는 cleanup effect가 같이 따라가는지 확인한다.
export const StoreMapPreview = ({
  className,
  focusPoint,
  initialLevel,
  isCompact = false,
  isFullBleed = false,
  isRouteCardDocked = false,
  isSearchFromMapPointLoading = false,
  onSelectStore,
  onRouteMapReady,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLeftInset = 0,
  selectedPinSafeArea,
  overlayInset,
  routeFocusTarget,
  routeLeftInset = 0,
  selectedStoreId,
  searchPoint,
  routePreview,
  stores,
  userLocation,
  originPoint,
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
  cameraOwnerRef,
  onUserCameraControl,
  onSelectedStoreCardClose,
  onSearchFromMapPoint,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();
  // 길찾기 경로를 맞출 때 아래쪽(모바일 바텀 시트)도 비운다.
  const routeBottomInset = overlayInset?.bottom ?? 0;
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
  // 경로 상세 펼치기 애니메이션 중에는 매 프레임 지도를 다시 그리지 않도록, 크기가 멈춘 뒤 한 번만 올린다.
  // (카드는 핀 기준 위로 자라도록 배치돼 있어, 애니메이션 중 위치를 다시 계산하지 않아도 핀에 붙어 있다)
  const selectedStoreCardLayoutKey = useElementResizeKey(
    selectedStoreCardRef,
    selectedStoreCard,
    STORE_MAP_CARD_RESIZE_SETTLE_MS,
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
    onUserCameraControl,
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
  });

  useEffect(() => {
    otherStoresRef.current = otherStores;
    onSelectStoreRef.current = onSelectStore;
    storesRef.current = stores;
    getPinFitPaddingRef.current = getPinFitPadding;
    isPinAutoFitPausedRef.current = isPinAutoFitPaused;
    shouldSkipPinAutoFitRef.current = () =>
      cameraOwnerRef?.current === "user" || shouldSkipPinAutoFit?.() === true;
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
    routeBottomInset,
    routePreview,
    selectedStoreCard,
    selectedStoreCardLeftInset,
    selectedStoreCardRef,
  });

  // 경로 상세를 펼치거나 창을 줄여도 카드 위쪽이 지도 밖으로 나가지 않게 한다.
  useKeepSelectedCardInView({
    isCardVisible: Boolean(
      selectedStore &&
      selectedStoreCard &&
      revealedCardStoreId === selectedStore.id &&
      !isRouteCardHeld,
    ),
    mapContainerRef,
    mapRef,
    resizeKey: selectedStoreCardLayoutKey,
    selectedStore,
    selectedStoreCardRef,
  });

  useRouteViewportEffects({
    isKakaoMapReady,
    mapContainerRef,
    mapRef,
    routeBottomInset,
    routeFocusTarget,
    routeLeftInset,
    routePreview,
    selectedStoreCardLeftInset,
  });

  // 매장 정보를 사이드바·바텀 시트에 보여줄 때: 선택 핀이 패널에 가리면 보이는 곳으로 옮긴다.
  useKeepSelectedPinVisible({
    isKakaoMapReady,
    isPaused: Boolean(routePreview),
    mapContainerRef,
    mapRef,
    safeArea: selectedPinSafeArea,
    selectedStore,
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
    userLocation,
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
        // isolate: 지도 위 버튼(z-30)이 지도 밖 패널·바텀 시트보다 위로 올라오지 않게 지도 안에 가둔다.
        "relative isolate overflow-hidden bg-white dark:bg-zinc-950",
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
        style={
          {
            "--map-overlay-bottom": `${overlayInset?.bottom ?? 0}px`,
            "--map-overlay-left": `${overlayInset?.left ?? 0}px`,
          } as CSSProperties
        }
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

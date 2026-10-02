"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { StoreMapControls } from "@/features/store/components/StoreMapControls";
import { StoreMapFallbackMarkers } from "@/features/store/components/StoreMapFallbackMarkers";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import { useMapFitTarget } from "@/features/store/hooks/useMapFitTarget";
import { useMapZoom } from "@/features/store/hooks/useMapZoom";
import { useOtherStoreOverlays } from "@/features/store/hooks/useOtherStoreOverlays";
import { useRouteDrawing } from "@/features/store/hooks/useRouteDrawing";
import { useRouteOverlays } from "@/features/store/hooks/useRouteOverlays";
import { useRouteRefocus } from "@/features/store/hooks/useRouteRefocus";
import { hasKakaoMapKey } from "@/shared/config/env";
import type { UserLocation } from "@/features/store/lib/geo";
import type {
  KakaoMapEventApi,
  KakaoMapWithCenter,
  MapOverlayHandle,
} from "@/features/store/lib/kakaoMapTypes";
import {
  getCenterPlacingPointAt,
  getRouteFitPadding,
  getStoreCardHeight,
  getStoreCardTopInset,
  STORE_CARD_MARKER_GAP,
  type KakaoMapWithProjection,
  type MapFitPadding,
  type MapPoint,
} from "@/features/store/lib/mapFit";
import { type RoutePreview } from "@/features/store/lib/mapRoute";
import type { StoreLocation } from "@/features/store/types";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import { getFallbackMarkerStyle } from "@/features/store/lib/storeMapFallbackLayout";
import {
  createCurrentLocationOverlay,
  createStoreMarkerOverlay,
  groupStoresByCoordinate,
} from "@/features/store/lib/storeMarkerOverlays";
import { cn } from "@/shared/lib/cn";

export type { MapFitPadding } from "@/features/store/lib/mapFit";

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** 지도 타일이 그려졌다는 이벤트(tilesloaded)가 오지 않아도 로딩 화면을 걷는 시간(ms) */
const MAP_FIRST_PAINT_FALLBACK_MS = 3000;
/** 카카오맵 SDK가 이 시간 안에 준비되지 않으면 로딩 화면을 걷고 대체 지도를 보여준다(ms) */
const MAP_SDK_LOAD_TIMEOUT_MS = 10000;
/** 초점 이동 완료(idle) 신호가 오지 않을 때 카드를 보여주기까지 기다리는 최대 시간(ms) */
const CARD_REVEAL_FALLBACK_MS = 700;
/** 길찾기: 지도 범위 맞춤 후 idle 신호가 오지 않을 때 경로 그리기를 시작하기까지 기다리는 최대 시간(ms) */
const ROUTE_FIT_READY_FALLBACK_MS = 800;

type SearchPointRef = MapPoint | null | undefined;
type FocusPointRef = MapPoint | null | undefined;

type RoutePreviewRef = RoutePreview | null | undefined;

type StoreMapPreviewProps = {
  className?: string;
  isFullBleed?: boolean;
  /** 길찾기 중 도착 매장 카드인지. 데스크톱에서는 지도 조작(드래그·확대/축소·클릭)으로 닫히지 않는다. */
  isRouteCardDocked?: boolean;
  focusPoint?: MapPoint | null;
  isSearchFromMapPointLoading?: boolean;
  selectedStore?: StoreLocation;
  selectedStoreCard?: ReactNode;
  selectedStoreCardLeftInset?: number;
  /** 길찾기 경로를 맞출 때 비워 둘 왼쪽 폭(검색/매장 목록 패널 영역, px). */
  routeLeftInset?: number;
  selectedStoreId: string;
  stores: StoreLocation[];
  searchPoint?: MapPoint | null;
  routePreview?: RoutePreview | null;
  userLocation?: UserLocation | null;
  isUserLocationLoading?: boolean;
  onMapPointSelect?: (point: MapPoint) => void;
  /** 지도 이동·확대/축소가 끝날 때마다 현재 지도 중심을 알려준다. */
  onCenterChange?: (point: MapPoint) => void;
  /** 지도 이동·확대/축소가 끝날 때마다 지금 보이는 지도 영역(중심·남서·북동 모서리)을 알려준다. */
  onViewportChange?: (viewport: {
    center: MapPoint;
    northEast: MapPoint;
    southWest: MapPoint;
  }) => void;
  /** 매장 id별 핀 글자. 없으면 stores 순서대로 A, B, C… */
  markerLabelById?: Record<string, string>;
  /** 매장 id별 핀 색상 정보. 선택된 서비스 필터가 있으면 색 분할·추가 개수를 반영한다. */
  markerColorInfoById?: Record<string, MarkerColorInfo>;
  /** 핀(현재 페이지) 외 나머지 매장. 핀 대신 반투명 원으로 위치만 표시한다. */
  otherStores?: StoreLocation[];
  /** 핀 외 나머지 매장 수. 0보다 크면 "나머지 매장 보기" 버튼을 보여준다. */
  otherStoreCount?: number;
  isOtherStoresVisible?: boolean;
  onToggleOtherStores?: () => void;
  /** 길찾기 경로를 가릴 수 있는 지도 위 패널(매장 목록)의 화면 영역. 없으면 null */
  getRouteObstacleRect?: () => DOMRect | null;
  /** 경로·출발/도착 지점·정보 카드가 위 패널에 가려졌을 때 호출 */
  onRouteObstructed?: () => void;
  /** key가 바뀔 때마다 points가 모두 보이도록 지도 범위를 맞춘다(검색 결과 표시용). */
  /** smooth: 순간 이동 대신 부드럽게 이동(panTo)하고, 모자라면 애니메이션으로 축소한다(페이지 전환용). */
  fitTarget?: { key: string; points: MapPoint[]; smooth?: boolean } | null;
  /** 값이 바뀌면 이번에 그리는 핀·원을 서서히 나타나게 한다(페이지 전환용). */
  markerEnterKey?: string;
  /**
   * 핀을 둘 때 비워 둘 여백(검색창·매장 목록 패널 등에 가리는 영역, 지도 컨테이너 기준 px).
   * 목록이 펼쳐졌는지에 따라 달라지므로 호출 시점에 잰다. 없으면 기본 여백.
   */
  getPinFitPadding?: (container: {
    height: number;
    width: number;
  }) => MapFitPadding | null;
  /** 값이 바뀌면(새 핀 묶음, 목록 펼침/접힘) 가장 바깥 핀까지 가리지 않고 보이는지 확인하고, 아니면 지도를 옮긴다. */
  pinAutoFitKey?: string;
  /** true면 자동 맞춤을 하지 않는다(정보 카드·길찾기 중 등). */
  isPinAutoFitPaused?: boolean;
  /** 자동 맞춤 직전에 호출해 true면 이번 맞춤을 건너뛴다(필터 해제 직후 보던 화면 유지 등). */
  shouldSkipPinAutoFit?: () => boolean;
  onFocusUserLocation?: () => void;
  onSelectedStoreCardClose?: () => void;
  onSearchFromMapPoint?: () => void;
  onSelectStore: (storeId: string) => void;
  /** 길찾기: 출발-경로-도착이 보이도록 지도 범위를 맞추고(이동 완료) 경로를 그리기 시작할 때, 그 경로 key */
  onRouteMapReady?: (routeKey: string) => void;
};

// 카카오맵 overlay는 React 렌더링 밖의 DOM을 직접 다루므로 lifecycle 정리가 중요하다.
// 마커/경로/카드 동작을 바꿀 때는 cleanup effect가 같이 따라가는지 확인한다.
export const StoreMapPreview = ({
  className,
  focusPoint,
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
  const [isMapSdkLoadTimedOut, setIsMapSdkLoadTimedOut] = useState(false);
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
  const [selectedStoreCardLayoutKey, setSelectedStoreCardLayoutKey] =
    useState(0);
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

  useEffect(() => {
    const selectedStoreCardElement = selectedStoreCardRef.current;

    if (!selectedStoreCardElement) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setSelectedStoreCardLayoutKey((layoutKey) => layoutKey + 1);
    });

    resizeObserver.observe(selectedStoreCardElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedStoreCard]);

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

  useEffect(() => {
    if (!hasKakaoMapKey) return;

    const timeoutId = window.setTimeout(
      () => setIsMapSdkLoadTimedOut(true),
      MAP_SDK_LOAD_TIMEOUT_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isKakaoMapReady || !mapContainerRef.current || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const centerStore = selectedStore ?? stores[0];

    if (!focusPoint && !searchPoint && !centerStore) {
      return;
    }

    const initialCenter = focusPoint
      ? new kakaoMaps.LatLng(focusPoint.lat, focusPoint.lng)
      : searchPoint
        ? new kakaoMaps.LatLng(searchPoint.lat, searchPoint.lng)
        : new kakaoMaps.LatLng(centerStore.lat, centerStore.lng);

    const isNewMap = mapRef.current === null;
    const map =
      mapRef.current ??
      new kakaoMaps.Map(mapContainerRef.current, {
        center: initialCenter,
        level: 4,
      });
    const shouldRecenterByFocusPoint =
      Boolean(focusPoint) && focusPointRef.current !== focusPoint;
    const shouldFitRoute =
      Boolean(routePreview) &&
      fittedRouteKeyRef.current !== routePreview?.routeKey;

    mapRef.current = map;
    focusPointRef.current = focusPoint;

    if (isNewMap) {
      // 첫 타일이 그려지면 로딩 화면을 걷는다. 이벤트가 오지 않아도 잠시 뒤에는 걷는다.
      const firstPaintEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
      const handleFirstTilesLoaded = () => {
        firstPaintEventApi.removeListener(
          map,
          "tilesloaded",
          handleFirstTilesLoaded,
        );
        setIsMapFirstPainted(true);
      };

      firstPaintEventApi.addListener(
        map,
        "tilesloaded",
        handleFirstTilesLoaded,
      );
      window.setTimeout(handleFirstTilesLoaded, MAP_FIRST_PAINT_FALLBACK_MS);
    }
    searchPointRef.current = searchPoint;
    routePreviewRef.current = routePreview;

    if (routePreview && (isNewMap || shouldFitRoute)) {
      const bounds = new kakaoMaps.LatLngBounds();
      const padding = getRouteFitPadding({
        cardElement: selectedStoreCardRef.current,
        containerWidth:
          mapContainerRef.current?.getBoundingClientRect().width ?? 0,
        hasStoreCard: Boolean(selectedStoreCard),
        routeLeftInset,
        selectedStoreCardLeftInset,
      });

      routePreview.path.forEach((point) => {
        bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
      });
      map.setBounds(
        bounds,
        padding.top,
        padding.right,
        padding.bottom,
        padding.left,
      );
      fittedRouteKeyRef.current = routePreview.routeKey;

      // 범위 맞춤이 끝나면(idle) 경로를 그리기 시작한다. idle이 오지 않으면 잠시 뒤 시작한다.
      const fittedRouteKey = routePreview.routeKey;

      pendingRouteFitKeyRef.current = fittedRouteKey;
      window.clearTimeout(routeFitFallbackTimeoutRef.current);
      routeFitFallbackTimeoutRef.current = window.setTimeout(() => {
        markRouteFitReadyRef.current(fittedRouteKey);
      }, ROUTE_FIT_READY_FALLBACK_MS);
    } else if (isNewMap || shouldRecenterByFocusPoint) {
      const recenterPoint =
        shouldRecenterByFocusPoint && focusPoint ? focusPoint : null;

      if (recenterPoint) {
        map.setCenter(
          new kakaoMaps.LatLng(recenterPoint.lat, recenterPoint.lng),
        );
        map.setLevel(4);

        // 선택 매장으로 이동할 때는 핀과 정보 카드가 왼쪽 패널에 가리지 않는 영역
        // (패널 오른쪽)의 가운데에 함께 보이도록 지도 중심을 보정한다.
        const isRecenteringToSelectedStore =
          Boolean(selectedStore && selectedStoreCard) &&
          selectedStore?.lat === recenterPoint.lat &&
          selectedStore?.lng === recenterPoint.lng;
        const projection = (map as KakaoMapWithProjection).getProjection?.();
        const containerRect = mapContainerRef.current?.getBoundingClientRect();

        if (
          isRecenteringToSelectedStore &&
          projection?.containerPointFromCoords &&
          containerRect
        ) {
          const leftInset =
            containerRect.width >= 768 ? selectedStoreCardLeftInset : 0;
          const topInset = getStoreCardTopInset(containerRect.width);
          const cardHeight = getStoreCardHeight(selectedStoreCardRef.current);
          const targetX = leftInset + (containerRect.width - leftInset) / 2;
          const targetY =
            (topInset + containerRect.height) / 2 +
            (cardHeight + STORE_CARD_MARKER_GAP) / 2;
          const deltaDegree = 0.001;
          const basePoint = projection.containerPointFromCoords(
            new kakaoMaps.LatLng(recenterPoint.lat, recenterPoint.lng),
          );
          const offsetPoint = projection.containerPointFromCoords(
            new kakaoMaps.LatLng(
              recenterPoint.lat + deltaDegree,
              recenterPoint.lng + deltaDegree,
            ),
          );
          const pxPerLat = (basePoint.y - offsetPoint.y) / deltaDegree;
          const pxPerLng = (offsetPoint.x - basePoint.x) / deltaDegree;

          if (pxPerLat > 0 && pxPerLng > 0) {
            const dx = targetX - containerRect.width / 2;
            const dy = targetY - containerRect.height / 2;

            map.setCenter(
              new kakaoMaps.LatLng(
                recenterPoint.lat + dy / pxPerLat,
                recenterPoint.lng - dx / pxPerLng,
              ),
            );
          }
        }
      }
    }

    const mapEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
    /** 선택 매장 핀의 화면 좌표와, 카드가 핀 바로 위에 온전히 들어갈 수 있는 핀 위치 범위 */
    const getSelectedStoreCardLayout = () => {
      if (!selectedStore || !mapContainerRef.current) {
        return null;
      }

      const projection = (map as KakaoMapWithProjection).getProjection?.();
      const point = projection?.containerPointFromCoords?.(
        new kakaoMaps.LatLng(selectedStore.lat, selectedStore.lng),
      );

      if (!point) {
        return null;
      }

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const effectiveLeftInset =
        containerRect.width >= 768 ? selectedStoreCardLeftInset : 0;
      const availableWidth = containerRect.width - effectiveLeftInset - 24;
      const cardWidth = Math.min(320, Math.max(0, availableWidth));
      const cardHeight = getStoreCardHeight(selectedStoreCardRef.current);
      const horizontalPadding = 12;
      const bottomPadding = 12;
      const minX = effectiveLeftInset + horizontalPadding + cardWidth / 2;
      const maxX = containerRect.width - horizontalPadding - cardWidth / 2;
      const maxY = containerRect.height - bottomPadding;
      const minY = Math.min(
        getStoreCardTopInset(containerRect.width) +
          cardHeight +
          STORE_CARD_MARKER_GAP,
        maxY,
      );

      return {
        containerRect,
        maxX: Math.max(minX, maxX),
        maxY,
        minX: Math.min(minX, maxX),
        minY,
        point,
      };
    };
    const updateSelectedStoreCardPosition = () => {
      const layout = getSelectedStoreCardLayout();

      if (!layout) {
        setSelectedStoreCardPosition(null);
        return;
      }

      const { containerRect, point } = layout;

      // 핀이 화면 밖으로 나가면(확대/축소·드래그로) 카드도 숨긴다.
      // 카드만 화면 가장자리에 붕 떠 있지 않도록 하기 위함. 핀이 다시 들어오면 자동으로 다시 뜬다.
      const isPinVisible =
        point.x >= 0 &&
        point.x <= containerRect.width &&
        point.y >= 0 &&
        point.y <= containerRect.height;

      if (!isPinVisible) {
        setSelectedStoreCardPosition(null);
        return;
      }

      // 카드는 항상 핀 바로 위에 붙어 있다(핀에서 떨어지지 않도록 위치를 제한하지 않는다).
      // 카드가 화면·왼쪽 패널 밖으로 빠져나가는 경우는 panToFitSelectedCard가 지도를 살짝 밀어 해결한다.
      setSelectedStoreCardPosition({
        left: `${point.x}px`,
        top: `${point.y}px`,
      });
    };
    /** 카드가 핀 위에 온전히 들어가는지 */
    const isSelectedCardInView = (
      layout: NonNullable<ReturnType<typeof getSelectedStoreCardLayout>>,
    ) =>
      layout.point.x >= layout.minX &&
      layout.point.x <= layout.maxX &&
      layout.point.y >= layout.minY &&
      layout.point.y <= layout.maxY;
    /**
     * 카드가 핀 위에 온전히 들어가도록 필요한 만큼만 지도를 부드럽게 민다.
     * (위쪽 핀은 카드 높이만큼 아래로, 가장자리·왼쪽 패널 쪽 핀은 안쪽으로) 옮겼으면 true.
     */
    const panToFitSelectedCard = (
      layout: NonNullable<ReturnType<typeof getSelectedStoreCardLayout>>,
    ) => {
      if (!selectedStore || !map.panTo) {
        return false;
      }

      const { containerRect, maxX, maxY, minX, minY, point } = layout;
      const nextCenter = getCenterPlacingPointAt(
        map,
        selectedStore,
        {
          x: clampValue(point.x, minX, maxX),
          y: clampValue(point.y, Math.min(minY + 12, maxY), maxY),
        },
        { height: containerRect.height, width: containerRect.width },
      );

      if (!nextCenter) {
        return false;
      }

      map.panTo(nextCenter);

      return true;
    };
    /**
     * 매장을 새로 고르면, 핀 위에 카드가 들어갈 자리가 없을 때(화면 위쪽·가장자리 핀)
     * 핀이 가려지지 않고 카드 높이만큼 여유가 생기도록 지도 초점을 부드럽게 옮긴다.
     */
    const ensureSelectedStoreInView = () => {
      if (!selectedStore || !selectedStoreCard) {
        return;
      }

      // 길찾기 경로를 그리는 동안에는 카드 자리 확보를 위해 지도를 옮기지 않는다(경로 범위 맞춤 유지).
      if (isRouteCardHeld) {
        return;
      }

      if (ensuredCardStoreIdRef.current === selectedStore.id) {
        return;
      }

      const layout = getSelectedStoreCardLayout();

      if (!layout) {
        return;
      }

      ensuredCardStoreIdRef.current = selectedStore.id;

      // 카드 자리가 이미 있으면 바로 보여준다.
      if (isSelectedCardInView(layout)) {
        setRevealedCardStoreId(selectedStore.id);
        return;
      }

      // 지도를 먼저 부드럽게 옮겨 카드 자리를 확보한 뒤(idle), 카드를 보여준다.
      setRevealedCardStoreId("");
      pendingRevealStoreIdRef.current = selectedStore.id;

      if (!panToFitSelectedCard(layout)) {
        revealPendingCard();
        return;
      }

      window.clearTimeout(revealFallbackTimeoutRef.current);
      revealFallbackTimeoutRef.current = window.setTimeout(() => {
        revealPendingCard();
      }, CARD_REVEAL_FALLBACK_MS);
    };
    /** 초점 이동이 끝나면 보류해 둔 카드를 보여준다. */
    const revealPendingCard = () => {
      const pendingStoreId = pendingRevealStoreIdRef.current;

      if (!pendingStoreId) {
        return;
      }

      pendingRevealStoreIdRef.current = "";
      window.clearTimeout(revealFallbackTimeoutRef.current);
      setRevealedCardStoreId(pendingStoreId);
      updateSelectedStoreCardPosition();
    };
    const handleMapDragEnd = () => {
      const movedCenter = (map as KakaoMapWithCenter).getCenter();

      onMapPointSelect?.({
        lat: movedCenter.getLat(),
        lng: movedCenter.getLng(),
      });
      // 길찾기 중(데스크톱)에는 지도를 끌어 경로를 살펴봐도 카드를 닫지 않는다.
      const isDesktop =
        (mapContainerRef.current?.getBoundingClientRect().width ?? 0) >= 768;

      if (!(isRouteCardDocked && isDesktop)) {
        onSelectedStoreCardClose?.();
      }
      updateSelectedStoreCardPosition();
    };
    const handleMapZoomChanged = () => {
      updateSelectedStoreCardPosition();
    };

    if (onMapPointSelect) {
      mapEventApi.addListener(map, "dragend", handleMapDragEnd);
    }

    // 지도 빈 곳을 클릭하면 정보 카드를 닫는다(드래그는 click이 아님).
    // 길찾기 중 데스크톱에서는 경로를 살펴보며 클릭해도 카드를 유지한다.
    const handleMapClick = () => {
      // 핀 클릭 직후 지도 click이 이어서 들어오는 경우는 무시(방금 연 카드가 바로 닫히지 않도록)
      if (Date.now() - lastMarkerClickAtRef.current < 300) {
        return;
      }

      const isDesktop =
        (mapContainerRef.current?.getBoundingClientRect().width ?? 0) >= 768;

      if (selectedStore && !(isRouteCardDocked && isDesktop)) {
        onSelectedStoreCardClose?.();
      }
    };

    mapEventApi.addListener(map, "click", handleMapClick);
    mapEventApi.addListener(map, "zoom_changed", handleMapZoomChanged);
    // 확대/축소 후 초점 이동(panTo)·드래그 중에도 정보 카드가 핀을 따라 움직이도록 매 이동마다 위치를 갱신한다.
    mapEventApi.addListener(map, "center_changed", handleMapZoomChanged);

    /** 길찾기 중 지도 이동·확대가 끝났을 때 경로/출발·도착/카드가 패널에 가려졌는지 확인한다. */
    const checkRouteObstruction = () => {
      const obstacleRect = getRouteObstacleRect?.();
      const containerRect = mapContainerRef.current?.getBoundingClientRect();
      const projection = (map as KakaoMapWithProjection).getProjection?.();

      if (
        !routePreview ||
        !obstacleRect ||
        !containerRect ||
        !projection?.containerPointFromCoords ||
        !onRouteObstructed
      ) {
        return;
      }

      const isInsideObstacle = (clientX: number, clientY: number) =>
        clientX >= obstacleRect.left &&
        clientX <= obstacleRect.right &&
        clientY >= obstacleRect.top &&
        clientY <= obstacleRect.bottom;
      const routePoints = [
        routePreview.origin,
        routePreview.destination,
        ...routePreview.path,
      ];
      const isRouteCovered = routePoints.some((point) => {
        const containerPoint = projection.containerPointFromCoords?.(
          new kakaoMaps.LatLng(point.lat, point.lng),
        );

        return (
          containerPoint &&
          isInsideObstacle(
            containerRect.left + containerPoint.x,
            containerRect.top + containerPoint.y,
          )
        );
      });
      const cardRect = selectedStoreCardRef.current?.getBoundingClientRect();
      const isCardCovered = Boolean(
        cardRect &&
        cardRect.width > 0 &&
        cardRect.left < obstacleRect.right &&
        cardRect.right > obstacleRect.left &&
        cardRect.top < obstacleRect.bottom &&
        cardRect.bottom > obstacleRect.top,
      );

      if (isRouteCovered || isCardCovered) {
        onRouteObstructed();
      }
    };
    const handleMapIdle = () => {
      const center = (map as KakaoMapWithCenter).getCenter();

      onCenterChange?.({ lat: center.getLat(), lng: center.getLng() });

      const bounds = map.getBounds?.();
      const southWest = bounds?.getSouthWest?.();
      const northEast = bounds?.getNorthEast?.();

      if (southWest && northEast) {
        onViewportChange?.({
          center: { lat: center.getLat(), lng: center.getLng() },
          northEast: { lat: northEast.getLat(), lng: northEast.getLng() },
          southWest: { lat: southWest.getLat(), lng: southWest.getLng() },
        });
      }
      revealPendingCard();

      // 길찾기 범위 맞춤 이동이 끝났으면 경로 그리기를 시작한다.
      if (pendingRouteFitKeyRef.current) {
        markRouteFitReadyRef.current(pendingRouteFitKeyRef.current);
      }

      // 확대/축소 버튼으로 카드가 화면 위쪽·가장자리 밖으로 나가게 되면, 지도를 살짝 밀어 카드를 핀 위에 온전히 띄운다.
      // 사용자가 직접 끌거나 휠로 움직인 경우에는 밀지 않는다(길찾기 중 지도를 자유롭게 옮겨 볼 수 있어야 하므로).
      // (핀 자체가 화면 밖으로 나간 경우도 밀지 않는다)
      const shouldAutoFit = autoFitCardAfterZoomRef.current;

      autoFitCardAfterZoomRef.current = false;

      const layout =
        shouldAutoFit &&
        revealedCardStoreId &&
        revealedCardStoreId === selectedStore?.id
          ? getSelectedStoreCardLayout()
          : null;

      if (
        layout &&
        layout.point.x >= 0 &&
        layout.point.x <= layout.containerRect.width &&
        layout.point.y >= 0 &&
        layout.point.y <= layout.containerRect.height &&
        !isSelectedCardInView(layout)
      ) {
        panToFitSelectedCard(layout);
      }

      checkRouteObstruction();
    };

    // idle 이벤트에서만 알린다. (effect 안에서 바로 호출하면 부모 setState → 재렌더 → effect 재실행 무한 루프)
    mapEventApi.addListener(map, "idle", handleMapIdle);

    overlayRefs.current.forEach(({ cleanup, overlay }) => {
      cleanup?.();
      overlay.setMap(null);
    });
    // 같은 좌표(소수 5자리, 약 1m)에 있는 매장들은 핀 하나로 묶고 개수를 표시한다.
    // 핀을 누르면 묶인 매장 목록이 떠서 그중 하나를 고를 수 있다.
    const storeGroups = groupStoresByCoordinate(stores);

    const isStoreCardShown = Boolean(selectedStore && selectedStoreCard);
    // 페이지가 바뀐 뒤 처음 그릴 때만 핀이 서서히 나타나게 한다(매장 선택 등으로 다시 그릴 때는 그대로).
    const shouldAnimateMarkerEnter =
      Boolean(markerEnterKey) &&
      animatedMarkerEnterKeyRef.current !== markerEnterKey;

    animatedMarkerEnterKeyRef.current = markerEnterKey;

    overlayRefs.current = storeGroups.map((group) =>
      createStoreMarkerOverlay({
        group,
        isStoreCardShown,
        kakaoMaps,
        map,
        markerColorInfoById,
        markerLabelById,
        selectedStoreId,
        shouldAnimateEnter: shouldAnimateMarkerEnter,
        onMarkerClick: () => {
          lastMarkerClickAtRef.current = Date.now();
        },
        onSelectStore: (storeId) => {
          // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
          if (storeId !== selectedStoreId) {
            setRevealedCardStoreId("");
          }
          onSelectStore(storeId);
        },
        onSelectClusterStore: (storeId) => {
          setRevealedCardStoreId("");
          // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
          if (storeId !== selectedStoreId) {
            setRevealedCardStoreId("");
          }
          onSelectStore(storeId);
        },
      }),
    );

    if (userLocation) {
      overlayRefs.current.push(
        createCurrentLocationOverlay({ kakaoMaps, map, userLocation }),
      );
    }

    if (!selectedStore || !selectedStoreCard) {
      ensuredCardStoreIdRef.current = "";
      pendingRevealStoreIdRef.current = "";
    }

    window.setTimeout(updateSelectedStoreCardPosition);
    // 카드가 그려져 실제 높이를 잴 수 있게 된 뒤에 초점 보정 여부를 판단한다.
    const ensureTimeoutId = window.setTimeout(ensureSelectedStoreInView, 60);

    return () => {
      window.clearTimeout(ensureTimeoutId);
      if (onMapPointSelect) {
        mapEventApi.removeListener(map, "dragend", handleMapDragEnd);
      }
      mapEventApi.removeListener(map, "click", handleMapClick);
      mapEventApi.removeListener(map, "zoom_changed", handleMapZoomChanged);
      mapEventApi.removeListener(map, "center_changed", handleMapZoomChanged);
      mapEventApi.removeListener(map, "idle", handleMapIdle);

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
    // markRouteFitReadyRef·pendingRouteFitKeyRef·routeFitFallbackTimeoutRef는 useRouteDrawing의 ref라 항상 같은 값이다.
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
  ]);

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

  // SDK를 끝내 불러오지 못하면 로딩 화면을 걷고 대체 지도(가짜 핀)를 보여준다.
  const isMapLoadingVisible =
    hasKakaoMapKey &&
    !isMapFirstPainted &&
    !(isMapSdkLoadTimedOut && !isKakaoMapReady);

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
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.22),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,248,251,0.96))] dark:bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.2),transparent_28%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]" />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.38]" />
        </>
      )}

      <div
        aria-hidden={!isMapLoadingVisible}
        className={cn(
          "absolute inset-0 z-40 flex items-center justify-center bg-gray-50 transition-opacity duration-300 dark:bg-zinc-950",
          isMapLoadingVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex flex-col items-center gap-3" role="status">
          <span
            aria-hidden="true"
            className="border-brand size-8 animate-spin rounded-full border-4 border-t-transparent"
          />
          <p className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
            지도를 불러오는 중이에요
          </p>
        </div>
      </div>

      <div className="pointer-events-none relative h-full min-h-[420px] p-5 sm:p-7">
        {!isKakaoMapReady && (
          <>
            <div className="bg-brand/15 pointer-events-none absolute top-[17%] left-[14%] h-24 w-24 rounded-full blur-2xl" />
            <div className="absolute right-[16%] bottom-[18%] h-32 w-32 rounded-full bg-orange-300/20 blur-3xl" />
          </>
        )}

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
            <div
              ref={selectedStoreCardRef}
              className={cn(
                // 카드는 항상 핀 바로 위(핀 끝에서 64px 위)에 뜬다.
                "pointer-events-auto absolute z-40 origin-bottom -translate-x-1/2 -translate-y-[calc(100%+64px)] transition-[opacity,scale] duration-300 ease-out",
                // 매장을 새로 고르면 초점 이동으로 카드 자리를 확보한 뒤에 나타난다(그 전엔 보이지 않게 크기만 잰다).
                // 길찾기 경로를 그리는 동안에는 카드를 접어 두고, 다 그린 뒤 펼친다.
                isRouteCardHeld
                  ? "pointer-events-none scale-95 opacity-0"
                  : revealedCardStoreId !== selectedStore.id
                    ? "pointer-events-none opacity-0"
                    : isMapAnimating && "opacity-40",
                isRouteCardDocked
                  ? // 길찾기 카드: 도착 매장 핀 바로 위에 붙이고, 브랜드 테두리로 눈에 띄게 한다.
                    "ring-brand w-[min(300px,calc(100%-24px))] rounded-sm shadow-[0_12px_32px_rgba(253,182,29,0.28)] ring-2"
                  : "w-[min(320px,calc(100%-24px))]",
              )}
              onClick={(event) => event.stopPropagation()}
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
            </div>
          )}

        {searchPoint && onSearchFromMapPoint && (
          <button
            type="button"
            onClick={() => {
              onSelectedStoreCardClose?.();
              onSearchFromMapPoint();
            }}
            disabled={isSearchFromMapPointLoading}
            className="bg-brand hover:bg-brand-hover pointer-events-auto absolute bottom-6 left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-extrabold whitespace-nowrap text-white shadow-lg transition disabled:cursor-wait disabled:opacity-80"
          >
            <RotateCcw
              size={16}
              className={cn(isSearchFromMapPointLoading && "animate-spin")}
            />
            이 지역에서 재검색
          </button>
        )}
      </div>
    </section>
  );
};

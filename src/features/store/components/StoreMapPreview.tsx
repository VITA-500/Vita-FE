"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LocateFixed, LocateOff, Minus, Plus, RotateCcw } from "lucide-react";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import type { UserLocation } from "@/features/store/lib/geo";
import type {
  StoreLocation,
  StoreRouteMode,
  StoreRouteSegmentKind,
} from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

const clampPercent = (value: number) => Math.min(88, Math.max(12, value));
const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
// 매장 핀: 원형 헤드 + 길게 뻗은 하단 꼬리 (흰 테두리 없음, 끝부분 radius 최소화)
const STORE_PIN_PATH = "M17 44 L4.16 22.75 A15 15 0 1 1 29.84 22.75 Z";
const STORE_PIN_SVG_MARKUP = `<svg viewBox="0 0 34 46" width="34" height="46" aria-hidden="true" style="display:block"><path d="${STORE_PIN_PATH}" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
const STORE_PIN_SHAPE_CLASS_NAME =
  "text-brand absolute inset-x-0 top-0 mx-auto block h-[46px] w-[34px] drop-shadow-[0_8px_14px_rgba(15,23,42,0.2)] transition group-hover:text-[#f5a400]";

const getStoreMarkerLabel = (index: number) =>
  String.fromCharCode(65 + (index % 26));
const routeStyleByMode: Record<
  StoreRouteMode,
  {
    color: string;
    glow: string;
    opacity: number;
    strokeStyle: "solid" | "shortdot";
    weight: number;
  }
> = {
  walk: {
    color: "#fdb61d",
    glow: "rgba(253, 182, 29, 0.22)",
    opacity: 1,
    strokeStyle: "shortdot",
    weight: 6,
  },
  car: {
    color: "#2563eb",
    glow: "rgba(37, 99, 235, 0.2)",
    opacity: 0.92,
    strokeStyle: "solid",
    weight: 7,
  },
  bicycle: {
    color: "#16a34a",
    glow: "rgba(22, 163, 74, 0.2)",
    opacity: 0.92,
    strokeStyle: "solid",
    weight: 7,
  },
  transit: {
    color: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.2)",
    opacity: 0.92,
    strokeStyle: "solid",
    weight: 7,
  },
};

type MapPoint = {
  lat: number;
  lng: number;
};

const getPathDistance = (from: MapPoint, to: MapPoint) => {
  const latDistance = to.lat - from.lat;
  const lngDistance = to.lng - from.lng;

  return Math.sqrt(latDistance ** 2 + lngDistance ** 2);
};

const getPartialRoutePath = (path: MapPoint[], progress: number) => {
  if (path.length <= 1 || progress >= 1) {
    return path;
  }

  const segmentDistances = path.slice(0, -1).map((point, index) => {
    return getPathDistance(point, path[index + 1]);
  });
  const totalDistance = segmentDistances.reduce(
    (sum, distance) => sum + distance,
    0,
  );

  if (totalDistance === 0) {
    return [path[0]];
  }

  let remainingDistance = totalDistance * Math.max(0, progress);
  const partialPath = [path[0]];

  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    const from = path[index];
    const to = path[index + 1];

    if (remainingDistance >= segmentDistance) {
      partialPath.push(to);
      remainingDistance -= segmentDistance;
      continue;
    }

    const segmentProgress =
      segmentDistance === 0 ? 0 : remainingDistance / segmentDistance;

    partialPath.push({
      lat: from.lat + (to.lat - from.lat) * segmentProgress,
      lng: from.lng + (to.lng - from.lng) * segmentProgress,
    });
    break;
  }

  return partialPath;
};

const getFallbackMarkerStyle = (
  store: StoreLocation,
  stores: StoreLocation[],
  index: number,
): CSSProperties => {
  const lats = stores.map((item) => item.lat);
  const lngs = stores.map((item) => item.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const duplicateOffset = (index % 5) * 1.8;

  return {
    left: `${clampPercent(
      lngRange === 0
        ? 50 + duplicateOffset
        : 12 + ((store.lng - minLng) / lngRange) * 76,
    )}%`,
    top: `${clampPercent(
      latRange === 0
        ? 50 + duplicateOffset
        : 88 - ((store.lat - minLat) / latRange) * 76,
    )}%`,
  };
};

type KakaoMapEventApi = {
  addListener: (
    target: KakaoMap,
    eventName: "dragend" | "zoom_changed" | "idle",
    callback: () => void,
  ) => void;
  removeListener: (
    target: KakaoMap,
    eventName: "dragend" | "zoom_changed" | "idle",
    callback: () => void,
  ) => void;
};

type KakaoMapWithCenter = KakaoMap & {
  getCenter: () => {
    getLat: () => number;
    getLng: () => number;
  };
};

type SearchPointRef = MapPoint | null | undefined;
type FocusPointRef = MapPoint | null | undefined;

type KakaoMapProjection = {
  containerPointFromCoords?: (latlng: KakaoLatLng) => {
    x: number;
    y: number;
  };
};

type KakaoMapWithProjection = KakaoMap & {
  getProjection?: () => KakaoMapProjection;
};

type MapOverlayHandle = {
  marker?: KakaoMarker;
  overlay: KakaoCustomOverlay;
  cleanup?: () => void;
};

type RoutePreview = {
  destination: MapPoint;
  mode: StoreRouteMode;
  origin: MapPoint;
  path: MapPoint[];
  routeKey: string;
  segments?: RoutePreviewSegment[];
};

type RoutePreviewSegment = {
  color?: string;
  kind: StoreRouteSegmentKind;
  lineName?: string;
  path: MapPoint[];
};

type RoutePreviewRef = RoutePreview | null | undefined;

const getRoutePathDistance = (path: MapPoint[]) => {
  return path
    .slice(0, -1)
    .reduce(
      (sum, point, index) => sum + getPathDistance(point, path[index + 1]),
      0,
    );
};

const getSequentialRouteSegments = (
  segments: RoutePreviewSegment[],
  progress: number,
) => {
  const segmentDistances = segments.map((segment) =>
    getRoutePathDistance(segment.path),
  );
  const totalDistance = segmentDistances.reduce(
    (sum, distance) => sum + distance,
    0,
  );
  let remainingDistance = totalDistance * Math.max(0, Math.min(progress, 1));

  if (totalDistance === 0) {
    return progress >= 1 ? segments : [];
  }

  return segments
    .map((segment, index) => {
      const segmentDistance = segmentDistances[index];

      if (remainingDistance <= 0) {
        return {
          ...segment,
          path: [],
        };
      }

      if (remainingDistance >= segmentDistance) {
        remainingDistance -= segmentDistance;
        return segment;
      }

      const segmentProgress =
        segmentDistance === 0 ? 1 : remainingDistance / segmentDistance;
      remainingDistance = 0;

      return {
        ...segment,
        path: getPartialRoutePath(segment.path, segmentProgress),
      };
    })
    .filter((segment) => segment.path.length >= 2);
};

const getFlatTransitFallbackSegments = (path: MapPoint[]) => {
  if (path.length < 4) {
    return [
      {
        color: routeStyleByMode.transit.color,
        kind: "transit" as const,
        path,
      },
    ];
  }

  const firstTransferIndex = Math.max(1, Math.floor(path.length * 0.08));
  const lastTransferIndex = Math.min(
    path.length - 2,
    Math.ceil(path.length * 0.92),
  );

  if (firstTransferIndex >= lastTransferIndex) {
    return [
      {
        color: routeStyleByMode.transit.color,
        kind: "transit" as const,
        path,
      },
    ];
  }

  return [
    {
      kind: "walk" as const,
      path: path.slice(0, firstTransferIndex + 1),
    },
    {
      color: routeStyleByMode.transit.color,
      kind: "transit" as const,
      path: path.slice(firstTransferIndex, lastTransferIndex + 1),
    },
    {
      kind: "walk" as const,
      path: path.slice(lastTransferIndex),
    },
  ];
};

const getTransferStops = (
  segments: RoutePreviewSegment[],
  fallbackMode: StoreRouteMode,
) => {
  const totalDistance = segments.reduce(
    (sum, segment) => sum + getRoutePathDistance(segment.path),
    0,
  );
  let passedDistance = 0;
  const stops = new Map<
    string,
    {
      color: string;
      point: MapPoint;
      progress: number;
    }
  >();

  segments.forEach((segment, index) => {
    const segmentDistance = getRoutePathDistance(segment.path);
    const point = segment.path[segment.path.length - 1];

    passedDistance += segmentDistance;

    if (!point || index === segments.length - 1) {
      return;
    }

    const nextSegment = segments[index + 1];
    const nextSegmentStyle = getTransitSegmentStyle(nextSegment, fallbackMode);
    const key = `${point.lat.toFixed(6)}:${point.lng.toFixed(6)}`;

    stops.set(key, {
      color: nextSegmentStyle.color,
      point,
      progress: totalDistance === 0 ? 1 : passedDistance / totalDistance,
    });
  });

  return Array.from(stops.values());
};

const getTransitSegmentStyle = (
  segment: RoutePreviewSegment,
  fallbackMode: StoreRouteMode,
) => {
  if (segment.kind === "walk") {
    if (fallbackMode === "transit") {
      return {
        ...routeStyleByMode.transit,
        color: "#a78bfa",
        glow: "rgba(167, 139, 250, 0.18)",
        opacity: 0.82,
        strokeStyle: "shortdot" as const,
        weight: 6,
      };
    }

    return {
      ...routeStyleByMode.walk,
      strokeStyle: "shortdot" as const,
      weight: 9,
    };
  }

  if (segment.kind === "subway") {
    return {
      ...routeStyleByMode.transit,
      color: segment.color ?? routeStyleByMode.transit.color,
      weight: 8,
    };
  }

  if (segment.kind === "bus") {
    return {
      ...routeStyleByMode.transit,
      color: segment.color ?? "#2563eb",
      weight: 7,
    };
  }

  return {
    ...routeStyleByMode[fallbackMode],
    color: segment.color ?? routeStyleByMode[fallbackMode].color,
  };
};

type StoreMapPreviewProps = {
  className?: string;
  isFullBleed?: boolean;
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
  /** 매장 id별 핀 글자. 없으면 stores 순서대로 A, B, C… */
  markerLabelById?: Record<string, string>;
  /** key가 바뀔 때마다 points가 모두 보이도록 지도 범위를 맞춘다(검색 결과 표시용). */
  fitTarget?: { key: string; points: MapPoint[] } | null;
  onFocusUserLocation?: () => void;
  onSelectedStoreCardClose?: () => void;
  onSearchFromMapPoint?: () => void;
  onSelectStore: (storeId: string) => void;
};

export const StoreMapPreview = ({
  className,
  focusPoint,
  isFullBleed = false,
  isRouteCardDocked = false,
  isSearchFromMapPointLoading = false,
  onSelectStore,
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
  markerLabelById,
  fitTarget,
  onSelectedStoreCardClose,
  onSearchFromMapPoint,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<MapOverlayHandle[]>([]);
  const routeOverlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const routeLineRefs = useRef<KakaoPolyline[]>([]);
  const selectedStoreCardRef = useRef<HTMLDivElement | null>(null);
  const [routeDrawState, setRouteDrawState] = useState({
    progress: 1,
    routeKey: "",
  });
  const [selectedStoreCardPosition, setSelectedStoreCardPosition] =
    useState<CSSProperties | null>(null);
  const [selectedStoreCardLayoutKey, setSelectedStoreCardLayoutKey] =
    useState(0);
  const fittedRouteKeyRef = useRef("");
  const fittedTargetKeyRef = useRef("");
  const focusPointRef = useRef<FocusPointRef>(undefined);
  const searchPointRef = useRef<SearchPointRef>(undefined);
  const routePreviewRef = useRef<RoutePreviewRef>(undefined);

  const routeDrawProgress =
    routePreview && routeDrawState.routeKey === routePreview.routeKey
      ? routeDrawState.progress
      : 0;
  const routePreviewKey = routePreview?.routeKey ?? "";
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

  const adjustZoomLevel = (direction: "in" | "out") => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentLevel = map.getLevel();
    const nextLevel =
      direction === "in"
        ? Math.max(1, currentLevel - 1)
        : Math.min(14, currentLevel + 1);

    map.setLevel(nextLevel);
  };

  useEffect(() => {
    if (!routePreviewKey) {
      return;
    }

    const startedAt = window.performance.now();
    const durationMs = 1400;
    let frameId = 0;

    const drawFrame = (timestamp: number) => {
      const nextProgress = Math.min((timestamp - startedAt) / durationMs, 1);

      setRouteDrawState({
        progress: nextProgress,
        routeKey: routePreviewKey,
      });

      if (nextProgress < 1) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    frameId = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [routePreviewKey]);

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
    searchPointRef.current = searchPoint;
    routePreviewRef.current = routePreview;

    if (routePreview && (isNewMap || shouldFitRoute)) {
      const bounds = new kakaoMaps.LatLngBounds();
      const containerWidth =
        mapContainerRef.current?.getBoundingClientRect().width ?? 0;
      const routeLeftPadding =
        containerWidth >= 768
          ? Math.max(
              48,
              selectedStoreCardLeftInset ? selectedStoreCardLeftInset + 24 : 0,
              // 출발-경로-도착이 왼쪽 매장 목록 패널 아래로 가려지지 않도록 패널 폭만큼 비운다.
              routeLeftInset ? routeLeftInset + 32 : 0,
            )
          : 48;
      const routeTopPadding = selectedStoreCard ? 300 : 160;
      const routeRightPadding = selectedStoreCard ? 400 : 72;
      const routeBottomPadding = selectedStoreCard ? 180 : 96;

      routePreview.path.forEach((point) => {
        bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
      });
      map.setBounds(
        bounds,
        routeTopPadding,
        routeRightPadding,
        routeBottomPadding,
        routeLeftPadding,
      );
      fittedRouteKeyRef.current = routePreview.routeKey;
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
          const topInset = containerRect.width >= 768 ? 80 : 140;
          const cardHeight =
            selectedStoreCardRef.current?.getBoundingClientRect().height ?? 320;
          const cardGap = 18;
          const targetX = leftInset + (containerRect.width - leftInset) / 2;
          const targetY =
            (topInset + containerRect.height) / 2 + (cardHeight + cardGap) / 2;
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
    const updateSelectedStoreCardPosition = () => {
      if (!selectedStore || !mapContainerRef.current) {
        setSelectedStoreCardPosition(null);
        return;
      }

      const projection = (map as KakaoMapWithProjection).getProjection?.();
      const selectedPosition = new kakaoMaps.LatLng(
        selectedStore.lat,
        selectedStore.lng,
      );
      const point = projection?.containerPointFromCoords?.(selectedPosition);

      if (!point) {
        setSelectedStoreCardPosition(null);
        return;
      }

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const effectiveLeftInset =
        containerRect.width >= 768 ? selectedStoreCardLeftInset : 0;
      const availableWidth = containerRect.width - effectiveLeftInset - 24;
      const cardWidth = Math.min(320, Math.max(0, availableWidth));
      const cardHeight =
        selectedStoreCardRef.current?.getBoundingClientRect().height ?? 340;
      const horizontalPadding = 12;
      const topPadding = 20;
      const bottomPadding = 12;
      const markerGap = 18;
      const minX = effectiveLeftInset + horizontalPadding + cardWidth / 2;
      const maxX = containerRect.width - horizontalPadding - cardWidth / 2;
      const clampedX = clampValue(
        point.x,
        Math.min(minX, maxX),
        Math.max(minX, maxX),
      );
      const maxY = containerRect.height - bottomPadding;
      const minY = Math.min(topPadding + cardHeight + markerGap, maxY);
      const clampedY = clampValue(point.y, minY, maxY);

      setSelectedStoreCardPosition({
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      });
    };
    const handleMapDragEnd = () => {
      const movedCenter = (map as KakaoMapWithCenter).getCenter();

      onMapPointSelect?.({
        lat: movedCenter.getLat(),
        lng: movedCenter.getLng(),
      });
      onSelectedStoreCardClose?.();
      updateSelectedStoreCardPosition();
    };
    const handleMapZoomChanged = () => {
      updateSelectedStoreCardPosition();
    };

    if (onMapPointSelect) {
      mapEventApi.addListener(map, "dragend", handleMapDragEnd);
    }
    mapEventApi.addListener(map, "zoom_changed", handleMapZoomChanged);

    const handleMapIdle = () => {
      const center = (map as KakaoMapWithCenter).getCenter();

      onCenterChange?.({ lat: center.getLat(), lng: center.getLng() });
    };

    // idle 이벤트에서만 알린다. (effect 안에서 바로 호출하면 부모 setState → 재렌더 → effect 재실행 무한 루프)
    mapEventApi.addListener(map, "idle", handleMapIdle);

    overlayRefs.current.forEach(({ cleanup, overlay }) => {
      cleanup?.();
      overlay.setMap(null);
    });
    // 같은 좌표(소수 5자리, 약 1m)에 있는 매장들은 핀 하나로 묶고 개수를 표시한다.
    // 핀을 누르면 묶인 매장 목록이 떠서 그중 하나를 고를 수 있다.
    const storeGroups = new Map<
      string,
      { index: number; store: StoreLocation }[]
    >();

    stores.forEach((store, index) => {
      const coordinateKey = `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`;
      const group = storeGroups.get(coordinateKey) ?? [];

      group.push({ index, store });
      storeGroups.set(coordinateKey, group);
    });

    overlayRefs.current = Array.from(storeGroups.values()).map((group) => {
      const [{ store: firstStore }] = group;
      const isCluster = group.length > 1;
      const selectedEntry = group.find(
        ({ store }) => store.id === selectedStoreId,
      );
      const isSelected = Boolean(selectedEntry);
      const getLabel = ({ index, store }: (typeof group)[number]) =>
        markerLabelById?.[store.id] ?? getStoreMarkerLabel(index);
      const position = new kakaoMaps.LatLng(firstStore.lat, firstStore.lng);
      const container = document.createElement("div");
      container.className = "relative";
      const marker = document.createElement("button");
      marker.type = "button";
      marker.setAttribute(
        "aria-label",
        isCluster
          ? `같은 위치 매장 ${group.length}곳 보기`
          : `${firstStore.name} 선택`,
      );
      marker.className = cn(
        "group relative block h-[46px] w-[38px] translate-y-[-8px] border-0 bg-transparent p-0 text-xs leading-none font-black text-white transition duration-150 hover:translate-y-[-10px] hover:scale-[1.04]",
        isSelected && "translate-y-[-10px] scale-[1.04]",
      );
      const markerShape = document.createElement("span");
      markerShape.className = STORE_PIN_SHAPE_CLASS_NAME;
      markerShape.innerHTML = STORE_PIN_SVG_MARKUP;

      const markerLetter = document.createElement("span");
      markerLetter.className =
        "absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white";
      markerLetter.textContent = isCluster
        ? String(group.length)
        : getLabel(group[0]);

      const markerTooltip = document.createElement("span");
      markerTooltip.className = cn(
        "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100",
        isSelected && "translate-y-0 opacity-100",
      );
      markerTooltip.textContent = selectedEntry
        ? selectedEntry.store.name
        : isCluster
          ? `같은 위치 매장 ${group.length}곳`
          : firstStore.name;

      if (isCluster) {
        // 묶음 핀임을 알 수 있도록 오른쪽 위에 작은 겹침 표시를 단다.
        const clusterBadge = document.createElement("span");

        clusterBadge.setAttribute("aria-hidden", "true");
        clusterBadge.className =
          "text-brand absolute -top-1 right-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] leading-none font-black shadow-sm";
        clusterBadge.textContent = "+";
        marker.append(clusterBadge);
      }

      marker.append(markerShape, markerLetter, markerTooltip);
      container.append(marker);

      let clusterList: HTMLDivElement | null = null;
      const closeClusterList = () => {
        clusterList?.remove();
        clusterList = null;
        marker.setAttribute("aria-expanded", "false");
      };
      const handleDocumentPointerDown = (event: PointerEvent) => {
        if (event.target instanceof Node && container.contains(event.target)) {
          return;
        }

        closeClusterList();
      };
      const openClusterList = () => {
        clusterList = document.createElement("div");
        clusterList.className =
          "absolute bottom-[calc(100%+4px)] left-1/2 z-[3] w-56 -translate-x-1/2 overflow-hidden rounded-sm bg-white text-left shadow-lg ring-1 ring-gray-950/5 dark:bg-zinc-950 dark:ring-white/10";

        const listTitle = document.createElement("p");

        listTitle.className =
          "border-b border-gray-100 px-3 py-2 text-[11px] font-extrabold text-gray-400 dark:border-white/10";
        listTitle.textContent = `같은 위치 매장 ${group.length}곳`;
        clusterList.append(listTitle);

        const list = document.createElement("div");

        list.className = "max-h-56 overflow-y-auto py-1";
        group.forEach((entry) => {
          const item = document.createElement("button");
          const itemLabel = document.createElement("span");
          const itemName = document.createElement("span");
          const isItemSelected = entry.store.id === selectedStoreId;

          item.type = "button";
          item.className = cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold transition",
            isItemSelected
              ? "bg-brand-soft text-gray-900 dark:bg-brand/10 dark:text-white"
              : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]",
          );
          itemLabel.className =
            "bg-brand flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-black text-white";
          itemLabel.textContent = getLabel(entry);
          itemName.className = "min-w-0 truncate";
          itemName.textContent = entry.store.name;
          item.append(itemLabel, itemName);
          item.addEventListener("click", (event) => {
            event.stopPropagation();
            closeClusterList();
            onSelectStore(entry.store.id);
          });
          list.append(item);
        });
        clusterList.append(list);
        container.append(clusterList);
        marker.setAttribute("aria-expanded", "true");
      };
      const handleMarkerClick = (event: MouseEvent) => {
        event.stopPropagation();

        if (!isCluster) {
          onSelectStore(firstStore.id);
          return;
        }

        if (clusterList) {
          closeClusterList();
        } else {
          openClusterList();
        }
      };

      const baseZIndex = isSelected ? 20 : 10;
      const overlay = new kakaoMaps.CustomOverlay({
        content: container,
        map,
        position,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: baseZIndex,
      });
      // hover 중인 핀의 툴팁(매장명)·묶음 목록이 이웃 핀 뒤로 가려지지 않도록 최상단으로 올린다.
      const handleMarkerEnter = () => overlay.setZIndex?.(40);
      const handleMarkerLeave = () => {
        if (!clusterList) {
          overlay.setZIndex?.(baseZIndex);
        }
      };

      marker.addEventListener("click", handleMarkerClick);
      container.addEventListener("mouseenter", handleMarkerEnter);
      container.addEventListener("mouseleave", handleMarkerLeave);
      document.addEventListener("pointerdown", handleDocumentPointerDown);

      return {
        cleanup: () => {
          closeClusterList();
          marker.removeEventListener("click", handleMarkerClick);
          container.removeEventListener("mouseenter", handleMarkerEnter);
          container.removeEventListener("mouseleave", handleMarkerLeave);
          document.removeEventListener(
            "pointerdown",
            handleDocumentPointerDown,
          );
        },
        overlay,
      };
    });

    if (userLocation) {
      const currentLocationMarker = document.createElement("div");
      currentLocationMarker.className = "vita-current-location-marker";
      currentLocationMarker.setAttribute("aria-label", "내 위치");

      overlayRefs.current.push({
        overlay: new kakaoMaps.CustomOverlay({
          content: currentLocationMarker,
          map,
          position: new kakaoMaps.LatLng(userLocation.lat, userLocation.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 30,
        }),
      });
    }

    window.setTimeout(updateSelectedStoreCardPosition);

    return () => {
      if (onMapPointSelect) {
        mapEventApi.removeListener(map, "dragend", handleMapDragEnd);
      }
      mapEventApi.removeListener(map, "zoom_changed", handleMapZoomChanged);
      mapEventApi.removeListener(map, "idle", handleMapIdle);

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
  }, [
    focusPoint,
    isKakaoMapReady,
    onSelectStore,
    onMapPointSelect,
    onCenterChange,
    markerLabelById,
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
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;

    if (
      !map ||
      !kakaoMaps ||
      !fitTarget ||
      fitTarget.points.length === 0 ||
      fittedTargetKeyRef.current === fitTarget.key
    ) {
      return;
    }

    fittedTargetKeyRef.current = fitTarget.key;

    if (fitTarget.points.length === 1) {
      const [point] = fitTarget.points;

      map.setCenter(new kakaoMaps.LatLng(point.lat, point.lng));
      map.setLevel(4);
      return;
    }

    const bounds = new kakaoMaps.LatLngBounds();
    const containerWidth =
      mapContainerRef.current?.getBoundingClientRect().width ?? 0;
    const leftPadding =
      containerWidth >= 768 ? Math.max(48, routeLeftInset + 32) : 48;

    fitTarget.points.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    // 위: 검색창·핀 높이, 오른쪽: 지도 컨트롤, 왼쪽: 매장 목록 패널 폭만큼 여유를 둔다.
    map.setBounds(bounds, 120, 96, 72, leftPadding);
  }, [fitTarget, isKakaoMapReady, routeLeftInset]);

  useEffect(() => {
    if (!isKakaoMapReady || !window.kakao?.maps || !mapRef.current) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const map = mapRef.current;

    routeLineRefs.current.forEach((line) => line.setMap(null));
    routeLineRefs.current = [];
    routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
    routeOverlayRefs.current = [];

    if (!routePreview) {
      return;
    }

    const routeStyle = routeStyleByMode[routePreview.mode];
    const routeSegments =
      routePreview.segments && routePreview.segments.length > 0
        ? routePreview.segments
        : routePreview.mode === "transit"
          ? getFlatTransitFallbackSegments(routePreview.path)
          : [
              {
                kind: routePreview.mode,
                path: routePreview.path,
              },
            ];
    const animatedRouteSegments = getSequentialRouteSegments(
      routeSegments,
      routeDrawProgress,
    );
    const transferStops = getTransferStops(
      routeSegments,
      routePreview.mode,
    ).filter((stop) => routeDrawProgress >= stop.progress);
    const animatedRoutePath = getPartialRoutePath(
      routePreview.path,
      routeDrawProgress,
    );
    const routeHead = animatedRoutePath[animatedRoutePath.length - 1];

    animatedRouteSegments.forEach((segment, index) => {
      const segmentStyle = getTransitSegmentStyle(segment, routePreview.mode);

      routeLineRefs.current.push(
        new kakaoMaps.Polyline({
          clickable: false,
          map,
          path: segment.path.map(
            (point) => new kakaoMaps.LatLng(point.lat, point.lng),
          ),
          strokeColor: segmentStyle.color,
          strokeOpacity: segmentStyle.opacity,
          strokeStyle: segmentStyle.strokeStyle,
          strokeWeight: segmentStyle.weight,
          zIndex: 35 + index,
        }),
      );
    });

    transferStops.forEach((stop) => {
      const transferMarker = document.createElement("span");
      const transferMarkerDot = document.createElement("span");

      transferMarker.setAttribute("aria-label", "교통수단 승하차 지점");
      transferMarker.style.display = "flex";
      transferMarker.style.width = "20px";
      transferMarker.style.height = "20px";
      transferMarker.style.alignItems = "center";
      transferMarker.style.justifyContent = "center";
      transferMarker.style.border = `4px solid ${stop.color}`;
      transferMarker.style.borderRadius = "9999px";
      transferMarker.style.background = stop.color;
      transferMarker.style.boxShadow =
        "0 6px 16px rgba(15, 23, 42, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.9)";
      transferMarker.style.pointerEvents = "none";

      transferMarkerDot.style.display = "block";
      transferMarkerDot.style.width = "8px";
      transferMarkerDot.style.height = "8px";
      transferMarkerDot.style.borderRadius = "9999px";
      transferMarkerDot.style.background = "#ffffff";
      transferMarker.appendChild(transferMarkerDot);

      routeOverlayRefs.current.push(
        new kakaoMaps.CustomOverlay({
          content: transferMarker,
          map,
          position: new kakaoMaps.LatLng(stop.point.lat, stop.point.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 43,
        }),
      );
    });

    const originMarker = document.createElement("span");
    originMarker.setAttribute("aria-label", "경로 시작점");
    originMarker.style.display = "block";
    originMarker.style.width = "16px";
    originMarker.style.height = "16px";
    originMarker.style.border = `4px solid ${routeStyle.color}`;
    originMarker.style.borderRadius = "9999px";
    originMarker.style.background = "#ffffff";
    originMarker.style.boxShadow =
      "0 4px 12px rgba(15, 23, 42, 0.18), inset 0 0 0 2px #ffffff";
    originMarker.style.pointerEvents = "none";

    routeOverlayRefs.current.push(
      new kakaoMaps.CustomOverlay({
        content: originMarker,
        map,
        position: new kakaoMaps.LatLng(
          routePreview.path[0].lat,
          routePreview.path[0].lng,
        ),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 36,
      }),
    );

    if (routeDrawProgress >= 1) {
      const destinationMarker = document.createElement("span");
      const destinationMarkerDot = document.createElement("span");

      destinationMarker.setAttribute("aria-label", "경로 도착점");
      destinationMarker.style.display = "flex";
      destinationMarker.style.width = "24px";
      destinationMarker.style.height = "24px";
      destinationMarker.style.alignItems = "center";
      destinationMarker.style.justifyContent = "center";
      destinationMarker.style.border = "3px solid #ffffff";
      destinationMarker.style.borderRadius = "50% 50% 50% 0";
      destinationMarker.style.background = routeStyle.color;
      destinationMarker.style.boxShadow = "0 6px 16px rgba(15, 23, 42, 0.22)";
      destinationMarker.style.pointerEvents = "none";
      destinationMarker.style.transform = "rotate(-45deg)";

      destinationMarkerDot.style.display = "block";
      destinationMarkerDot.style.width = "8px";
      destinationMarkerDot.style.height = "8px";
      destinationMarkerDot.style.borderRadius = "9999px";
      destinationMarkerDot.style.background = "#ffffff";
      destinationMarkerDot.style.transform = "rotate(45deg)";
      destinationMarker.appendChild(destinationMarkerDot);

      routeOverlayRefs.current.push(
        new kakaoMaps.CustomOverlay({
          content: destinationMarker,
          map,
          position: new kakaoMaps.LatLng(
            routePreview.path[routePreview.path.length - 1].lat,
            routePreview.path[routePreview.path.length - 1].lng,
          ),
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 38,
        }),
      );
    }

    if (routeHead && routeDrawProgress < 1) {
      const routeHeadMarker = document.createElement("span");
      routeHeadMarker.setAttribute("aria-label", "경로 진행 지점");
      routeHeadMarker.style.display = "block";
      routeHeadMarker.style.width = "18px";
      routeHeadMarker.style.height = "18px";
      routeHeadMarker.style.border = "4px solid #ffffff";
      routeHeadMarker.style.borderRadius = "9999px";
      routeHeadMarker.style.background = routeStyle.color;
      routeHeadMarker.style.boxShadow = `0 0 0 7px ${routeStyle.glow}, 0 8px 18px rgba(15, 23, 42, 0.2)`;
      routeHeadMarker.style.pointerEvents = "none";

      routeOverlayRefs.current.push(
        new kakaoMaps.CustomOverlay({
          content: routeHeadMarker,
          map,
          position: new kakaoMaps.LatLng(routeHead.lat, routeHead.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 42,
        }),
      );
    }

    return () => {
      routeLineRefs.current.forEach((line) => line.setMap(null));
      routeLineRefs.current = [];
      routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
      routeOverlayRefs.current = [];
    };
  }, [isKakaoMapReady, routeDrawProgress, routePreview]);

  return (
    <section
      data-kakao-map-ready={isKakaoMapReady}
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

      <div className="pointer-events-none relative h-full min-h-[420px] p-5 sm:p-7">
        {!isKakaoMapReady && (
          <>
            <div className="bg-brand/15 pointer-events-none absolute top-[17%] left-[14%] h-24 w-24 rounded-full blur-2xl" />
            <div className="absolute right-[16%] bottom-[18%] h-32 w-32 rounded-full bg-orange-300/20 blur-3xl" />
          </>
        )}

        {!isKakaoMapReady &&
          stores.map((store, index) => {
            const isSelected = selectedStoreId === store.id;

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => onSelectStore(store.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group pointer-events-auto absolute block h-[46px] w-[38px] -translate-x-1/2 -translate-y-[calc(50%+8px)] border-0 bg-transparent p-0 text-xs leading-none font-black text-white transition duration-150 hover:-translate-y-[calc(50%+10px)] hover:scale-[1.04]",
                  isSelected && "-translate-y-[calc(50%+10px)] scale-[1.04]",
                )}
                style={getFallbackMarkerStyle(store, stores, index)}
              >
                <span
                  className={STORE_PIN_SHAPE_CLASS_NAME}
                  dangerouslySetInnerHTML={{ __html: STORE_PIN_SVG_MARKUP }}
                />
                <span className="absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white">
                  {markerLabelById?.[store.id] ?? getStoreMarkerLabel(index)}
                </span>
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100",
                    isSelected && "translate-y-0 opacity-100",
                  )}
                >
                  {store.name}
                </span>
              </button>
            );
          })}

        <div className="pointer-events-auto absolute right-4 bottom-6 z-30 flex flex-col gap-1 rounded-sm border border-gray-200 bg-white p-1 shadow-md shadow-gray-950/10 md:right-6 md:bottom-8 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
          {onFocusUserLocation && (
            <>
              <button
                type="button"
                onClick={onFocusUserLocation}
                disabled={isUserLocationLoading}
                className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 dark:text-gray-200"
                aria-label="내 위치로 이동"
              >
                {userLocation ? (
                  <LocateFixed size={18} className="text-brand" />
                ) : (
                  <LocateOff size={18} />
                )}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => adjustZoomLevel("in")}
            className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:text-gray-200"
            aria-label="지도 확대"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => adjustZoomLevel("out")}
            className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:text-gray-200"
            aria-label="지도 축소"
          >
            <Minus size={18} />
          </button>
        </div>

        {selectedStore && selectedStoreCard && (
          <button
            type="button"
            className="pointer-events-auto absolute inset-0 z-30 cursor-default"
            aria-label="매장 정보 카드 닫기"
            onClick={onSelectedStoreCardClose}
          />
        )}

        {selectedStore &&
          selectedStoreCard &&
          (selectedStoreCardPosition || !isKakaoMapReady) && (
            <div
              ref={selectedStoreCardRef}
              className={cn(
                "pointer-events-auto absolute z-40",
                isRouteCardDocked
                  ? // 길찾기 카드는 내용을 압축해 스크롤 없이 전부 보여준다.
                    "top-24 right-3 w-[min(300px,calc(100%-24px))] md:top-28 md:right-6"
                  : "w-[min(320px,calc(100%-24px))]",
                !isRouteCardDocked &&
                  "-translate-x-1/2 -translate-y-[calc(100%+18px)]",
              )}
              onClick={(event) => event.stopPropagation()}
              style={
                isRouteCardDocked
                  ? undefined
                  : (selectedStoreCardPosition ??
                    getFallbackMarkerStyle(
                      selectedStore,
                      stores,
                      stores.findIndex(
                        (store) => store.id === selectedStore.id,
                      ),
                    ))
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

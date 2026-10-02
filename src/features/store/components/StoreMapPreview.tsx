"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Layers,
  LocateFixed,
  LocateOff,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import { hasKakaoMapKey } from "@/shared/config/env";
import type { UserLocation } from "@/features/store/lib/geo";
import type {
  StoreLocation,
  StoreRouteMode,
  StoreRouteSegmentKind,
} from "@/features/store/types";
import { cn } from "@/shared/lib/cn";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";

const clampPercent = (value: number) => Math.min(88, Math.max(12, value));
const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
// 매장 핀: 원형 헤드 + 길게 뻗은 하단 꼬리 (흰 테두리 없음, 끝부분 radius 최소화)
const STORE_PIN_PATH = "M17 44 L4.16 22.75 A15 15 0 1 1 29.84 22.75 Z";
const STORE_PIN_SHAPE_CLASS_NAME =
  "text-brand absolute inset-x-0 top-0 mx-auto block h-[46px] w-[34px] drop-shadow-[0_8px_14px_rgba(15,23,42,0.2)] transition group-hover:text-[#f5a400]";

type MarkerColorInfo = {
  colors: string[];
  extraServices: { color: string; label: string }[];
};

const getStableHash = (value: string) => {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
};

const getMarkerGradientId = ({
  colors,
  coordinateKey,
  storeIds,
}: {
  colors: string[];
  coordinateKey: string;
  storeIds: string[];
}) =>
  `vita-store-pin-gradient-${getStableHash(
    `${coordinateKey}|${[...storeIds].sort().join(",")}|${colors.join(",")}`,
  )}`;

const getStorePinSvgMarkup = ({
  colors,
  gradientId,
}: {
  colors: string[];
  gradientId: string;
}) => {
  if (colors.length <= 1) {
    const color = colors[0] ?? "currentColor";

    return `<svg viewBox="0 0 34 46" width="34" height="46" aria-hidden="true" style="display:block"><path d="${STORE_PIN_PATH}" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
  }

  const center = { x: 17, y: 20 };
  const radius = 38;
  const angleStep = 360 / colors.length;
  const getPoint = (angle: number) => {
    const radian = ((angle - 90) * Math.PI) / 180;

    return {
      x: Number((center.x + Math.cos(radian) * radius).toFixed(3)),
      y: Number((center.y + Math.sin(radian) * radius).toFixed(3)),
    };
  };
  const clipPaths = colors
    .map((_, index) => {
      const startAngle = index * angleStep;
      const endAngle = (index + 1) * angleStep;
      const start = getPoint(startAngle);
      const end = getPoint(endAngle);
      const largeArcFlag = angleStep > 180 ? 1 : 0;
      const clipId = `${gradientId}-slice-${index}`;

      return `<clipPath id="${clipId}"><path d="M ${center.x} ${center.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z" /></clipPath>`;
    })
    .join("");
  const slices = colors
    .map(
      (color, index) =>
        `<path d="${STORE_PIN_PATH}" fill="${color}" clip-path="url(#${gradientId}-slice-${index})" />`,
    )
    .join("");

  return `<svg viewBox="0 0 34 46" width="34" height="46" aria-hidden="true" style="display:block"><defs>${clipPaths}</defs>${slices}<path d="${STORE_PIN_PATH}" fill="none" stroke="rgba(255,255,255,0.86)" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
};

/**
 * 매장 정보 카드 위치 계산 공통 값.
 * - 선택 매장으로 지도 중심을 옮길 때와, 카드가 지도 위쪽 밖으로 나가지 않게 막을 때 같은 값을 쓴다.
 * - 위쪽 여백은 좌측 상단 검색창 영역(데스크톱: 위 20px + 높이 48px, 모바일: 상단 여백 포함 약 124px)을 피하는 높이다.
 */
/** 지도 타일이 그려졌다는 이벤트(tilesloaded)가 오지 않아도 로딩 화면을 걷는 시간(ms) */
const MAP_FIRST_PAINT_FALLBACK_MS = 3000;
/** 카카오맵 SDK가 이 시간 안에 준비되지 않으면 로딩 화면을 걷고 대체 지도를 보여준다(ms) */
const MAP_SDK_LOAD_TIMEOUT_MS = 10000;
const STORE_CARD_TOP_INSET_DESKTOP = 80;
const STORE_CARD_TOP_INSET_MOBILE = 140;
/** 카드가 아직 그려지지 않아 높이를 잴 수 없을 때 쓰는 추정 높이 */
const STORE_CARD_ESTIMATED_HEIGHT = 320;
/**
 * 카드 아래쪽과 핀 끝(좌표 지점) 사이 간격.
 * 핀 높이 46px + 선택 시 떠오르는 10px + 여유 8px → 카드가 핀 머리를 가리지 않는다.
 * (카드의 -translate-y-[calc(100%+64px)]와 같은 값)
 */
const STORE_CARD_MARKER_GAP = 64;
/** 초점 이동 완료(idle) 신호가 오지 않을 때 카드를 보여주기까지 기다리는 최대 시간(ms) */
const CARD_REVEAL_FALLBACK_MS = 700;
/** 길찾기: 지도 범위 맞춤 후 idle 신호가 오지 않을 때 경로 그리기를 시작하기까지 기다리는 최대 시간(ms) */
const ROUTE_FIT_READY_FALLBACK_MS = 800;
/** 길찾기: 경로를 다 그린 뒤 정보 카드를 띄우기까지의 텀(ms) */
const ROUTE_CARD_REVEAL_DELAY_MS = 220;
/** 확대/축소 버튼 애니메이션 시간(ms) */
const ZOOM_ANIMATION_MS = 320;
/** 새 핀이 꽂히거나 목록을 펼친 뒤 가림 여부를 확인하기까지 기다리는 시간(ms) */
const PIN_AUTO_FIT_DELAY_MS = 160;
/** 페이지 전환 등으로 새로 나타나는 핀·원이 서서히 보이는 시간(ms) */
const MARKER_ENTER_ANIMATION_MS = 280;

/** 핀·원 DOM이 아래에서 살짝 떠오르며 나타나게 한다. */
const playMarkerEnterAnimation = (element: HTMLElement) => {
  element.animate?.(
    [
      { opacity: 0, transform: "translateY(6px) scale(0.85)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: MARKER_ENTER_ANIMATION_MS, easing: "ease-out", fill: "both" },
  );
};
/** 길찾기 중 확대/축소 전에 초점 지점으로 지도를 미리 옮기는 시간(ms, 카카오 panTo 애니메이션 여유 포함) */
const ZOOM_FOCUS_PAN_MS = 280;

const getStoreCardTopInset = (containerWidth: number) =>
  containerWidth >= 768
    ? STORE_CARD_TOP_INSET_DESKTOP
    : STORE_CARD_TOP_INSET_MOBILE;

const getStoreCardHeight = (
  card: HTMLElement | null,
  estimatedHeight = STORE_CARD_ESTIMATED_HEIGHT,
) => card?.getBoundingClientRect().height || estimatedHeight;

/**
 * point가 지도 컨테이너의 (targetX, targetY) 픽셀 위치에 오도록 하는 지도 중심 좌표를 구한다.
 * 현재 확대 수준의 픽셀↔위경도 비율을 projection으로 재서 계산한다(짧은 거리에서는 선형 근사로 충분).
 */
const getCenterPlacingPointAt = (
  map: KakaoMap,
  point: MapPoint,
  target: { x: number; y: number },
  container: { width: number; height: number },
) => {
  const kakaoMaps = window.kakao?.maps;
  const projection = (map as KakaoMapWithProjection).getProjection?.();

  if (!kakaoMaps || !projection?.containerPointFromCoords) {
    return null;
  }

  const deltaDegree = 0.001;
  const basePoint = projection.containerPointFromCoords(
    new kakaoMaps.LatLng(point.lat, point.lng),
  );
  const offsetPoint = projection.containerPointFromCoords(
    new kakaoMaps.LatLng(point.lat + deltaDegree, point.lng + deltaDegree),
  );
  const pxPerLat = (basePoint.y - offsetPoint.y) / deltaDegree;
  const pxPerLng = (offsetPoint.x - basePoint.x) / deltaDegree;

  if (!(pxPerLat > 0) || !(pxPerLng > 0)) {
    return null;
  }

  const dx = target.x - container.width / 2;
  const dy = target.y - container.height / 2;

  return new kakaoMaps.LatLng(
    point.lat + dy / pxPerLat,
    point.lng - dx / pxPerLng,
  );
};

/**
 * 길찾기 경로를 화면에 맞출 때 비워 둘 여백(왼쪽 패널·위쪽 카드·오른쪽 컨트롤 영역).
 * 컴포넌트 밖 순수 함수로 두어, 렌더·effect 어디서 불러도 선언 순서·의존성 문제가 없게 한다.
 */
const getRouteFitPadding = ({
  cardElement,
  containerWidth,
  hasStoreCard,
  routeLeftInset,
  selectedStoreCardLeftInset,
}: {
  cardElement: HTMLElement | null;
  containerWidth: number;
  hasStoreCard: boolean;
  routeLeftInset: number;
  selectedStoreCardLeftInset: number;
}) => ({
  bottom: 96,
  left:
    containerWidth >= 768
      ? Math.max(
          48,
          selectedStoreCardLeftInset ? selectedStoreCardLeftInset + 24 : 0,
          // 출발-경로-도착이 왼쪽 매장 목록 패널 아래로 가려지지 않도록 패널 폭만큼 비운다.
          routeLeftInset ? routeLeftInset + 32 : 0,
        )
      : 48,
  right: 72,
  // 길찾기 카드는 도착 매장 핀 위에 붙어 뜨므로, 위쪽에 카드가 들어갈 자리를 남긴다.
  top: hasStoreCard
    ? getStoreCardTopInset(containerWidth) +
      getStoreCardHeight(cardElement, 240) +
      STORE_CARD_MARKER_GAP
    : 160,
});

export type MapFitPadding = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

/** 핀이 들어갈 기본 여백: 위 검색창·핀 높이, 오른쪽 지도 컨트롤, 왼쪽 매장 목록 패널 */
const getDefaultPinFitPadding = (
  containerWidth: number,
  routeLeftInset: number,
): MapFitPadding => ({
  bottom: 72,
  left: containerWidth >= 768 ? Math.max(48, routeLeftInset + 32) : 48,
  right: 96,
  top: 120,
});

/** 좌표들을 지도 컨테이너 기준 화면 좌표로 바꾼다. 투영 정보가 없으면 null */
const getScreenPoints = (map: KakaoMap, points: MapPoint[]) => {
  const kakaoMaps = window.kakao?.maps;
  const projection = (map as KakaoMapWithProjection).getProjection?.();

  if (!kakaoMaps || !projection?.containerPointFromCoords) {
    return null;
  }

  return points.map((point) =>
    projection.containerPointFromCoords!(
      new kakaoMaps.LatLng(point.lat, point.lng),
    ),
  );
};

/** 모든 좌표가 여백을 뺀 영역(패널·검색창에 가리지 않는 곳) 안에 있는지 */
const arePointsInFreeArea = (
  map: KakaoMap,
  points: MapPoint[],
  container: { height: number; width: number },
  padding: MapFitPadding,
) => {
  const screenPoints = getScreenPoints(map, points);

  if (!screenPoints) {
    return true;
  }

  return screenPoints.every(
    (point) =>
      point.x >= padding.left &&
      point.x <= container.width - padding.right &&
      point.y >= padding.top &&
      point.y <= container.height - padding.bottom,
  );
};

/**
 * 점들이 모두 보이도록 지도를 부드럽게 옮긴다.
 * 1) 핀이 들어갈 영역(여백 제외)의 가운데로 panTo  2) 그래도 넘치면 이동 후 필요한 만큼만 애니메이션 축소.
 * 계산할 수 없으면 false(호출한 쪽에서 setBounds 등으로 처리). 축소 예약 타이머 id를 onZoomScheduled로 넘긴다.
 */
const fitPointsSmoothlyOnMap = (
  map: KakaoMap,
  points: MapPoint[],
  container: { height: number; width: number },
  padding: MapFitPadding,
  onZoomScheduled: (timeoutId: number) => void,
) => {
  const kakaoMaps = window.kakao?.maps;
  const screenPoints = getScreenPoints(map, points);

  if (!kakaoMaps || !map.panTo || !screenPoints || points.length === 0) {
    return false;
  }

  const freeWidth = container.width - padding.left - padding.right;
  const freeHeight = container.height - padding.top - padding.bottom;

  if (freeWidth <= 0 || freeHeight <= 0) {
    return false;
  }

  const spanX =
    Math.max(...screenPoints.map((point) => point.x)) -
    Math.min(...screenPoints.map((point) => point.x));
  const spanY =
    Math.max(...screenPoints.map((point) => point.y)) -
    Math.min(...screenPoints.map((point) => point.y));
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const pointsCenter = {
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
  const nextCenter = getCenterPlacingPointAt(
    map,
    pointsCenter,
    { x: padding.left + freeWidth / 2, y: padding.top + freeHeight / 2 },
    container,
  );

  if (!nextCenter) {
    return false;
  }

  map.panTo(nextCenter);

  // 현재 확대 수준에서 다 들어가지 않으면, 이동이 끝난 뒤 필요한 단계만큼 부드럽게 축소한다.
  const overflowRatio = Math.max(spanX / freeWidth, spanY / freeHeight);

  if (overflowRatio > 1) {
    const zoomOutLevels = Math.ceil(Math.log2(overflowRatio));

    onZoomScheduled(
      window.setTimeout(() => {
        map.setLevel(map.getLevel() + zoomOutLevels, {
          anchor: new kakaoMaps.LatLng(pointsCenter.lat, pointsCenter.lng),
          animate: { duration: ZOOM_ANIMATION_MS },
        });
      }, ZOOM_ANIMATION_MS),
    );
  }

  return true;
};

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
    eventName:
      | "dragend"
      | "zoom_changed"
      | "idle"
      | "center_changed"
      | "click"
      | "tilesloaded",
    callback: () => void,
  ) => void;
  removeListener: (
    target: KakaoMap,
    eventName:
      | "dragend"
      | "zoom_changed"
      | "idle"
      | "center_changed"
      | "click"
      | "tilesloaded",
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
  // 나머지 매장(반투명 원) 오버레이. 핀 오버레이와 따로 관리해 핀을 다시 그리지 않고 켜고 끌 수 있게 한다.
  const otherStoreOverlayRefs = useRef<MapOverlayHandle[]>([]);
  // 핀 등장 애니메이션을 마지막으로 재생한 key(같은 key로 다시 그릴 때는 재생하지 않음)
  const animatedMarkerEnterKeyRef = useRef("");
  const fitZoomTimeoutRef = useRef<number | undefined>(undefined);
  const [controlTooltip, setControlTooltip] = useState<RailTooltipProps | null>(
    null,
  );
  const otherStoresRef = useRef(otherStores);
  const storesRef = useRef(stores);
  const getPinFitPaddingRef = useRef(getPinFitPadding);
  const isPinAutoFitPausedRef = useRef(isPinAutoFitPaused);
  const shouldSkipPinAutoFitRef = useRef(shouldSkipPinAutoFit);
  const routeLeftInsetRef = useRef(routeLeftInset);
  const onSelectStoreRef = useRef(onSelectStore);
  const routeOverlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const routeLineRefs = useRef<KakaoPolyline[]>([]);
  const selectedStoreCardRef = useRef<HTMLDivElement | null>(null);
  // 길찾기: 지도 범위를 맞추고 이동이 끝난 경로 key. 이 key가 되기 전에는 경로를 그리지 않는다.
  const [routeFitReadyKey, setRouteFitReadyKey] = useState("");
  // 길찾기: 경로를 다 그린 뒤 정보 카드를 다시 보여도 되는 경로 key
  const [routeCardRevealKey, setRouteCardRevealKey] = useState("");
  // 범위 맞춤 후 idle을 기다리는 경로 key와 대비용 타이머
  const pendingRouteFitKeyRef = useRef("");
  const routeFitFallbackTimeoutRef = useRef<number | undefined>(undefined);
  const onRouteMapReadyRef = useRef(onRouteMapReady);
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
  // 경로 그리기가 끝난 뒤 초점 보정을 마친 경로 key
  const refocusedRouteKeyRef = useRef("");
  const zoomFocusTimeoutRef = useRef<number | undefined>(undefined);
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
  const zoomSettleTimeoutRef = useRef<number | undefined>(undefined);
  const [isMapAnimating, setIsMapAnimating] = useState(false);

  useEffect(
    () => () => {
      window.clearTimeout(revealFallbackTimeoutRef.current);
      window.clearTimeout(zoomFocusTimeoutRef.current);
      window.clearTimeout(zoomSettleTimeoutRef.current);
    },
    [],
  );
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

    if (nextLevel === currentLevel) {
      return;
    }

    // 버튼 확대/축소가 끝나면(idle) 카드가 화면 밖으로 나갔는지 한 번 보정한다.
    autoFitCardAfterZoomRef.current = true;

    const containerRect = mapContainerRef.current?.getBoundingClientRect();

    // 길찾기 중이 아니면 기본 동작(지도 중심 기준 확대/축소)
    if (!routePreview || routePreview.path.length === 0 || !containerRect) {
      map.setLevel(nextLevel, { animate: { duration: ZOOM_ANIMATION_MS } });
      return;
    }

    // 길찾기 중: 확대는 도착 매장(정보 카드가 떠 있으면 카드 포함), 축소는 경로 전체 가운데를 초점으로 잡아
    // 확대/축소 후 경로와 카드가 검색 패널·카드에 가리지 않는 영역 가운데에 오도록 부드럽게 옮긴다.
    const isDesktop = containerRect.width >= 768;
    const leftInset = isDesktop
      ? Math.max(selectedStoreCardLeftInset, routeLeftInset + 16)
      : 0;
    const topInset = getStoreCardTopInset(containerRect.width);
    const isCardVisible = Boolean(selectedStore && selectedStoreCard);
    const cardSpace = isCardVisible
      ? getStoreCardHeight(selectedStoreCardRef.current, 240) +
        STORE_CARD_MARKER_GAP
      : 0;
    const latitudes = routePreview.path.map((point) => point.lat);
    const longitudes = routePreview.path.map((point) => point.lng);
    const routeCenter = {
      lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
    const focusOnDestination = direction === "in";
    const focusPoint = focusOnDestination
      ? routePreview.destination
      : routeCenter;
    const target = {
      x: leftInset + (containerRect.width - leftInset) / 2,
      // 도착 매장에 초점을 둘 때는 핀 위 카드 자리까지 감안해 핀을 아래로 내린다.
      y: focusOnDestination
        ? (topInset + containerRect.height) / 2 + cardSpace / 2
        : (topInset + cardSpace + containerRect.height) / 2,
    };

    // 부드럽게: ① 현재 확대 수준에서 초점 지점을 목표 위치로 먼저 천천히 옮기고(panTo)
    //          ② 그 지점을 기준점(anchor)으로 확대/축소해 초점이 화면에서 움직이지 않게 한다.
    // 이동 중에는 정보 카드를 잠시 흐리게 해 지도와 따로 노는 것처럼 보이지 않게 한다.
    window.clearTimeout(zoomFocusTimeoutRef.current);
    window.clearTimeout(zoomSettleTimeoutRef.current);
    setIsMapAnimating(true);

    const nextCenter = getCenterPlacingPointAt(map, focusPoint, target, {
      height: containerRect.height,
      width: containerRect.width,
    });

    if (nextCenter) {
      map.panTo?.(nextCenter);
    }

    zoomFocusTimeoutRef.current = window.setTimeout(
      () => {
        const kakaoMaps = window.kakao?.maps;

        // 앞선 초점 이동(panTo)의 idle에서 표시가 소비됐을 수 있으므로 확대/축소 직전에 다시 켠다.
        autoFitCardAfterZoomRef.current = true;
        map.setLevel(nextLevel, {
          anchor: kakaoMaps
            ? new kakaoMaps.LatLng(focusPoint.lat, focusPoint.lng)
            : undefined,
          animate: { duration: ZOOM_ANIMATION_MS },
        });

        zoomSettleTimeoutRef.current = window.setTimeout(() => {
          setIsMapAnimating(false);
        }, ZOOM_ANIMATION_MS + 40);
      },
      nextCenter ? ZOOM_FOCUS_PAN_MS : 0,
    );
  };

  useEffect(() => {
    onRouteMapReadyRef.current = onRouteMapReady;
  });

  /** 지도 범위 맞춤(이동)이 끝났다: 경로 그리기를 시작하고 부모(탐색 중 모달)에 알린다. */
  const markRouteFitReady = (routeKey: string) => {
    if (!routeKey || pendingRouteFitKeyRef.current !== routeKey) {
      return;
    }

    pendingRouteFitKeyRef.current = "";
    window.clearTimeout(routeFitFallbackTimeoutRef.current);
    setRouteFitReadyKey(routeKey);
    onRouteMapReadyRef.current?.(routeKey);
  };
  const markRouteFitReadyRef = useRef(markRouteFitReady);

  useEffect(() => {
    markRouteFitReadyRef.current = markRouteFitReady;
  });

  useEffect(
    () => () => {
      window.clearTimeout(routeFitFallbackTimeoutRef.current);
    },
    [],
  );

  // 길찾기가 끝나거나(경로 없음) 다른 경로를 불러오는 중이면 상태를 비워,
  // 같은 경로를 다시 보여줄 때도 범위 맞춤 → 그리기 → 카드 순서를 처음부터 밟게 한다.
  useEffect(() => {
    if (routePreviewKey) {
      return;
    }

    fittedRouteKeyRef.current = "";
    pendingRouteFitKeyRef.current = "";
    window.clearTimeout(routeFitFallbackTimeoutRef.current);
  }, [routePreviewKey]);

  // (상태 초기화는 렌더 중 이전 key와 비교해 처리한다. effect 안 setState는 연쇄 렌더를 만든다)
  const [lastRoutePreviewKey, setLastRoutePreviewKey] =
    useState(routePreviewKey);

  if (lastRoutePreviewKey !== routePreviewKey) {
    setLastRoutePreviewKey(routePreviewKey);

    if (!routePreviewKey) {
      setRouteFitReadyKey("");
      setRouteCardRevealKey("");
    }
  }

  // 지도 SDK가 없으면(대체 화면) 맞출 지도가 없으므로 바로 준비 완료로 본다.
  useEffect(() => {
    if (!isKakaoMapReady && routePreviewKey) {
      pendingRouteFitKeyRef.current = routePreviewKey;
      markRouteFitReadyRef.current(routePreviewKey);
    }
  }, [isKakaoMapReady, routePreviewKey]);

  // 경로를 다 그리면 잠깐 뒤 정보 카드를 자연스럽게 다시 띄운다.
  const isRouteDrawComplete =
    Boolean(routePreviewKey) &&
    routeDrawState.routeKey === routePreviewKey &&
    routeDrawState.progress >= 1;

  useEffect(() => {
    if (!isRouteDrawComplete) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRouteCardRevealKey(routePreviewKey);
    }, ROUTE_CARD_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRouteDrawComplete, routePreviewKey]);

  // 길찾기 중 경로를 그리기 전·그리는 동안에는 정보 카드를 접어 둔다.
  const isRouteCardHeld =
    Boolean(routePreviewKey) && routeCardRevealKey !== routePreviewKey;

  useEffect(() => {
    // 지도 공간이 확보되기 전에는 경로를 그리지 않는다.
    if (!routePreviewKey || routeFitReadyKey !== routePreviewKey) {
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
  }, [routePreviewKey, routeFitReadyKey]);

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

    const isStoreCardShown = Boolean(selectedStore && selectedStoreCard);
    // 페이지가 바뀐 뒤 처음 그릴 때만 핀이 서서히 나타나게 한다(매장 선택 등으로 다시 그릴 때는 그대로).
    const shouldAnimateMarkerEnter =
      Boolean(markerEnterKey) &&
      animatedMarkerEnterKeyRef.current !== markerEnterKey;

    animatedMarkerEnterKeyRef.current = markerEnterKey;

    overlayRefs.current = Array.from(storeGroups.values()).map((group) => {
      const [{ store: firstStore }] = group;
      const isCluster = group.length > 1;
      const selectedEntry = group.find(
        ({ store }) => store.id === selectedStoreId,
      );
      const isSelected = Boolean(selectedEntry);
      const getLabel = ({ index, store }: (typeof group)[number]) =>
        markerLabelById?.[store.id] ?? getStoreMarkerLabel(index);
      const colorTargetStore = selectedEntry?.store ?? firstStore;
      const markerColorInfo = markerColorInfoById?.[colorTargetStore.id];
      const markerColors = markerColorInfo?.colors ?? [];
      const coordinateKey = `${firstStore.lat.toFixed(5)}:${firstStore.lng.toFixed(5)}`;
      const gradientId = getMarkerGradientId({
        colors: markerColors,
        coordinateKey,
        storeIds: group.map(({ store }) => store.id),
      });
      const position = new kakaoMaps.LatLng(firstStore.lat, firstStore.lng);
      const container = document.createElement("div");
      container.className = "relative";

      if (shouldAnimateMarkerEnter) {
        playMarkerEnterAnimation(container);
      }
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
      markerShape.innerHTML = getStorePinSvgMarkup({
        colors: markerColors,
        gradientId,
      });

      const markerLetter = document.createElement("span");
      markerLetter.className =
        "absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white [text-shadow:_0_1px_2px_rgb(15_23_42_/_0.45)]";
      markerLetter.textContent = isCluster
        ? String(group.length)
        : getLabel(group[0]);

      const markerTooltip = document.createElement("span");
      markerTooltip.className = cn(
        "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100",
        isSelected && "translate-y-0 opacity-100",
        // 정보 카드가 떠 있으면 카드에 매장명이 있으므로 선택 핀의 이름 툴팁은 숨긴다.
        isSelected && isStoreCardShown && "hidden",
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
        clusterBadge.style.color = markerColors[0] ?? "";
        clusterBadge.textContent = "+";
        marker.append(clusterBadge);
      }

      if (markerColorInfo && markerColorInfo.extraServices.length > 0) {
        const extraColorBadge = document.createElement("span");
        const extraColorTooltip = document.createElement("span");
        const extraServicesText = markerColorInfo.extraServices
          .map((service) => service.label)
          .join(", ");

        extraColorBadge.setAttribute(
          "aria-label",
          `추가 필터 조건: ${extraServicesText}`,
        );
        extraColorBadge.className =
          "group/extra absolute -top-1 left-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/90 px-1 text-[9px] leading-none font-black text-white shadow-sm";
        extraColorBadge.textContent = `+${markerColorInfo.extraServices.length}`;
        extraColorTooltip.className =
          "pointer-events-none absolute top-[calc(100%+6px)] left-0 z-[4] flex min-w-max translate-y-1 flex-col gap-1 rounded-sm bg-slate-950/95 px-2.5 py-1.5 text-[10px] leading-snug font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/extra:translate-y-0 group-hover/extra:opacity-100 group-focus-visible/extra:translate-y-0 group-focus-visible/extra:opacity-100";
        markerColorInfo.extraServices.forEach((service) => {
          const row = document.createElement("span");
          const dot = document.createElement("span");
          const label = document.createElement("span");

          row.className = "flex items-center gap-1.5";
          dot.className = "h-2 w-2 shrink-0 rounded-full";
          dot.style.backgroundColor = service.color;
          label.textContent = service.label;
          row.append(dot, label);
          extraColorTooltip.append(row);
        });
        extraColorBadge.append(extraColorTooltip);
        marker.append(extraColorBadge);
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
            setRevealedCardStoreId("");
            // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
            if (entry.store.id !== selectedStoreId) {
              setRevealedCardStoreId("");
            }
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
        lastMarkerClickAtRef.current = Date.now();

        if (!isCluster) {
          // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
          if (firstStore.id !== selectedStoreId) {
            setRevealedCardStoreId("");
          }
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
  }, [
    focusPoint,
    isKakaoMapReady,
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

  // 배열이 렌더마다 새로 만들어져도 구성(매장·좌표)이 같으면 원을 다시 그리지 않도록 key로 비교한다.
  const otherStoresKey = otherStores
    .map((store) => `${store.id}:${store.lat}:${store.lng}`)
    .join(",");

  useEffect(() => {
    otherStoresRef.current = otherStores;
    onSelectStoreRef.current = onSelectStore;
    storesRef.current = stores;
    getPinFitPaddingRef.current = getPinFitPadding;
    isPinAutoFitPausedRef.current = isPinAutoFitPaused;
    shouldSkipPinAutoFitRef.current = shouldSkipPinAutoFit;
    routeLeftInsetRef.current = routeLeftInset;
  });

  /** 핀(현재 페이지) 외 나머지 매장을 반투명 원으로 그린다. 페이지를 옮기면 그 페이지 매장은 핀으로 바뀐다. */
  useEffect(() => {
    const map = mapRef.current;

    if (!isKakaoMapReady || !map || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;

    otherStoreOverlayRefs.current = otherStoresRef.current.map((store) => {
      const dot = document.createElement("button");
      const tooltip = document.createElement("span");

      dot.type = "button";
      dot.setAttribute("aria-label", `${store.name} 선택`);
      // 지도 위에서도 잘 보이도록 브랜드 진한 색(brand-hover) + 흰 테두리 + 그림자로 표시한다.
      dot.className =
        "group bg-brand-hover relative block h-4 w-4 rounded-full border-2 border-white p-0 opacity-80 shadow-[0_2px_6px_rgba(15,23,42,0.35)] transition duration-150 hover:scale-125 hover:opacity-100";

      playMarkerEnterAnimation(dot);
      tooltip.className =
        "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100";
      tooltip.textContent = store.name;
      dot.append(tooltip);

      const handleDotClick = (event: MouseEvent) => {
        event.stopPropagation();
        lastMarkerClickAtRef.current = Date.now();
        setRevealedCardStoreId("");
        onSelectStoreRef.current(store.id);
      };

      dot.addEventListener("click", handleDotClick);

      const overlay = new kakaoMaps.CustomOverlay({
        content: dot,
        map,
        position: new kakaoMaps.LatLng(store.lat, store.lng),
        xAnchor: 0.5,
        yAnchor: 0.5,
        // 핀(10~)보다 아래에 깔아 핀을 가리지 않게 한다.
        zIndex: 5,
      });
      const handleDotEnter = () => overlay.setZIndex?.(40);
      const handleDotLeave = () => overlay.setZIndex?.(5);

      dot.addEventListener("mouseenter", handleDotEnter);
      dot.addEventListener("mouseleave", handleDotLeave);

      return {
        cleanup: () => {
          dot.removeEventListener("click", handleDotClick);
          dot.removeEventListener("mouseenter", handleDotEnter);
          dot.removeEventListener("mouseleave", handleDotLeave);
        },
        overlay,
      };
    });

    return () => {
      otherStoreOverlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      otherStoreOverlayRefs.current = [];
    };
  }, [isKakaoMapReady, otherStoresKey]);

  /**
   * 경로 그리기 애니메이션이 끝났을 때 경로가 화면(여백 제외 영역)에 온전히 보이지 않으면 다시 초점을 맞춘다.
   * (그리는 도중 사용자가 지도를 움직였거나, 실제 경로가 도착해 모양이 바뀐 경우)
   * - 현재 확대 수준에서 들어가면 부드럽게 이동(panTo)만 하고
   * - 들어가지 않으면 경로 전체가 보이도록 범위를 다시 맞춘다.
   */
  const isRouteDrawn = routeDrawProgress >= 1;
  const drawnRouteKey = routePreview?.routeKey ?? "";

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;
    const projection = map
      ? (map as KakaoMapWithProjection).getProjection?.()
      : undefined;
    const containerRect = mapContainerRef.current?.getBoundingClientRect();

    if (
      !isRouteDrawn ||
      !routePreview ||
      !map ||
      !kakaoMaps ||
      !projection?.containerPointFromCoords ||
      !containerRect ||
      refocusedRouteKeyRef.current === drawnRouteKey
    ) {
      return;
    }

    refocusedRouteKeyRef.current = drawnRouteKey;

    const padding = getRouteFitPadding({
      cardElement: selectedStoreCardRef.current,
      containerWidth:
        mapContainerRef.current?.getBoundingClientRect().width ?? 0,
      hasStoreCard: Boolean(selectedStoreCard),
      routeLeftInset,
      selectedStoreCardLeftInset,
    });
    const routePoints = [
      routePreview.origin,
      routePreview.destination,
      ...routePreview.path,
    ];
    const screenPoints = routePoints
      .map((point) =>
        projection.containerPointFromCoords?.(
          new kakaoMaps.LatLng(point.lat, point.lng),
        ),
      )
      .filter((point): point is { x: number; y: number } => Boolean(point));

    if (screenPoints.length === 0) {
      return;
    }

    const minX = Math.min(...screenPoints.map((point) => point.x));
    const maxX = Math.max(...screenPoints.map((point) => point.x));
    const minY = Math.min(...screenPoints.map((point) => point.y));
    const maxY = Math.max(...screenPoints.map((point) => point.y));
    const freeLeft = padding.left;
    const freeRight = containerRect.width - padding.right;
    const freeTop = padding.top;
    const freeBottom = containerRect.height - padding.bottom;
    const isFullyVisible =
      minX >= freeLeft &&
      maxX <= freeRight &&
      minY >= freeTop &&
      maxY <= freeBottom;

    if (isFullyVisible) {
      return;
    }

    const fitsAtCurrentLevel =
      maxX - minX <= freeRight - freeLeft &&
      maxY - minY <= freeBottom - freeTop;

    if (fitsAtCurrentLevel && map.panTo) {
      const latitudes = routePoints.map((point) => point.lat);
      const longitudes = routePoints.map((point) => point.lng);
      const routeCenter = {
        lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
        lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      };
      const nextCenter = getCenterPlacingPointAt(
        map,
        routeCenter,
        { x: (freeLeft + freeRight) / 2, y: (freeTop + freeBottom) / 2 },
        { height: containerRect.height, width: containerRect.width },
      );

      if (nextCenter) {
        map.panTo(nextCenter);
        return;
      }
    }

    const bounds = new kakaoMaps.LatLngBounds();

    routePoints.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    map.setBounds(
      bounds,
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    );
    // 경로 모양이 바뀔 때만 다시 맞춘다(지도를 직접 옮겨 보는 것은 막지 않도록 한 번만 실행)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteDrawn, drawnRouteKey]);

  useEffect(
    () => () => {
      window.clearTimeout(fitZoomTimeoutRef.current);
    },
    [],
  );

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
    window.clearTimeout(fitZoomTimeoutRef.current);

    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    const container = {
      height: containerRect?.height ?? 0,
      width: containerRect?.width ?? 0,
    };
    // 목록 펼침 여부에 따라 가리는 영역이 달라지므로 맞추는 순간의 여백을 쓴다.
    const padding =
      getPinFitPaddingRef.current?.(container) ??
      getDefaultPinFitPadding(container.width, routeLeftInset);

    if (
      fitTarget.smooth &&
      fitPointsSmoothlyOnMap(
        map,
        fitTarget.points,
        container,
        padding,
        (timeoutId) => {
          fitZoomTimeoutRef.current = timeoutId;
        },
      )
    ) {
      return;
    }

    if (fitTarget.points.length === 1) {
      const [point] = fitTarget.points;

      map.setCenter(new kakaoMaps.LatLng(point.lat, point.lng));
      map.setLevel(4);
      return;
    }

    const bounds = new kakaoMaps.LatLngBounds();

    fitTarget.points.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    // 검색창·매장 목록(펼친 경우)·지도 컨트롤에 가리지 않도록 여백을 둔다.
    map.setBounds(
      bounds,
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    );
  }, [fitTarget, isKakaoMapReady, routeLeftInset]);

  /**
   * 새 핀 묶음이 꽂히거나 매장 목록을 펼치고 접을 때:
   * 가장 바깥 핀까지 검색창·목록 패널에 가리지 않는지 보고, 가리면 지도를 부드럽게 옮긴다(필요하면 축소).
   * 이미 다 보이면 지도를 건드리지 않는다.
   */
  useEffect(() => {
    if (!pinAutoFitKey || !isKakaoMapReady) {
      return;
    }

    // 목록 패널이 그려져 크기를 잴 수 있고, 핀이 자리 잡은 뒤에 확인한다.
    const timeoutId = window.setTimeout(() => {
      const map = mapRef.current;
      const containerRect = mapContainerRef.current?.getBoundingClientRect();
      const points = storesRef.current.map((store) => ({
        lat: store.lat,
        lng: store.lng,
      }));

      if (
        !map ||
        !containerRect ||
        points.length === 0 ||
        isPinAutoFitPausedRef.current ||
        shouldSkipPinAutoFitRef.current?.()
      ) {
        return;
      }

      const container = {
        height: containerRect.height,
        width: containerRect.width,
      };
      const padding =
        getPinFitPaddingRef.current?.(container) ??
        getDefaultPinFitPadding(container.width, routeLeftInsetRef.current);

      if (arePointsInFreeArea(map, points, container, padding)) {
        return;
      }

      window.clearTimeout(fitZoomTimeoutRef.current);
      fitPointsSmoothlyOnMap(map, points, container, padding, (zoomId) => {
        fitZoomTimeoutRef.current = zoomId;
      });
    }, PIN_AUTO_FIT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isKakaoMapReady, pinAutoFitKey]);

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

    // 지도 공간이 확보되기 전에는 경로(선·출발/도착 표시)를 그리지 않는다.
    if (!routePreview || routeFitReadyKey !== routePreview.routeKey) {
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
  }, [isKakaoMapReady, routeDrawProgress, routeFitReadyKey, routePreview]);

  const otherStoresToggleLabel = isOtherStoresVisible
    ? "나머지 매장 위치 숨기기"
    : `나머지 매장 ${otherStoreCount}곳 위치 보기`;
  /** 지도 컨트롤 툴팁: 공용 RailTooltip을 버튼 왼쪽(화면 오른쪽 끝이라)에 띄운다. */
  const showControlTooltip = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();

    setControlTooltip({
      label: otherStoresToggleLabel,
      placement: "left",
      x: rect.left - 8,
      y: rect.top + rect.height / 2,
    });
  };
  // 켜고 끌 때 툴팁 문구도 바로 바꾼다.
  const visibleControlTooltip = controlTooltip
    ? { ...controlTooltip, label: otherStoresToggleLabel }
    : null;

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

        {!isKakaoMapReady &&
          stores.map((store, index) => {
            const isSelected = selectedStoreId === store.id;
            const markerColorInfo = markerColorInfoById?.[store.id];
            const markerColors = markerColorInfo?.colors ?? [];
            const gradientId = getMarkerGradientId({
              colors: markerColors,
              coordinateKey: `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`,
              storeIds: [store.id],
            });

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
                  dangerouslySetInnerHTML={{
                    __html: getStorePinSvgMarkup({
                      colors: markerColors,
                      gradientId,
                    }),
                  }}
                />
                {markerColorInfo &&
                  markerColorInfo.extraServices.length > 0 && (
                    <span
                      className="group/extra absolute -top-1 left-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/90 px-1 text-[9px] leading-none font-black text-white shadow-sm"
                      aria-label={`추가 필터 조건: ${markerColorInfo.extraServices
                        .map((service) => service.label)
                        .join(", ")}`}
                    >
                      +{markerColorInfo.extraServices.length}
                      <span className="pointer-events-none absolute top-[calc(100%+6px)] left-0 z-[4] flex min-w-max translate-y-1 flex-col gap-1 rounded-sm bg-slate-950/95 px-2.5 py-1.5 text-[10px] leading-snug font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/extra:translate-y-0 group-hover/extra:opacity-100">
                        {markerColorInfo.extraServices.map((service) => (
                          <span
                            key={service.label}
                            className="flex items-center gap-1.5"
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                            {service.label}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                <span className="absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white [text-shadow:_0_1px_2px_rgb(15_23_42_/_0.45)]">
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

        <div className="pointer-events-none absolute right-4 bottom-6 z-30 flex flex-col items-end gap-1 md:right-6 md:bottom-8">
          {/* 나머지 매장 보기: 내 위치 버튼 묶음 바로 위(4px 간격) */}
          {onToggleOtherStores && otherStoreCount > 0 && (
            <div className="pointer-events-auto rounded-sm border border-gray-200 bg-white p-1 shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
              <button
                type="button"
                onClick={onToggleOtherStores}
                aria-pressed={isOtherStoresVisible}
                aria-label={otherStoresToggleLabel}
                onMouseEnter={(event) =>
                  showControlTooltip(event.currentTarget)
                }
                onMouseLeave={() => setControlTooltip(null)}
                onFocus={(event) => showControlTooltip(event.currentTarget)}
                onBlur={() => setControlTooltip(null)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
                  isOtherStoresVisible
                    ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                    : "hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand text-gray-700 dark:text-gray-200",
                )}
              >
                <Layers size={18} />
                <span className="bg-brand absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none font-black text-white">
                  {otherStoreCount}
                </span>
              </button>
              {/* 다른 화면 툴팁과 같은 공용 RailTooltip. 지도 패널 안 transform·overflow에 갇히지 않게 body로 띄운다. */}
              {visibleControlTooltip &&
                createPortal(
                  <RailTooltip {...visibleControlTooltip} />,
                  document.body,
                )}
            </div>
          )}
          <div className="pointer-events-auto flex flex-col gap-1 rounded-sm border border-gray-200 bg-white p-1 shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
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
        </div>

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

import type { RoutePreviewSegment } from "@/features/store/lib/mapRoute";
import type { StoreRouteMode } from "@/features/store/types";

/* 길찾기 경로 선 스타일: 이동 수단별 기본 색·굵기, 구간(도보·지하철·버스·연결선)별 스타일. */

export type RouteStyle = {
  color: string;
  glow: string;
  opacity: number;
  strokeStyle: "solid" | "shortdot";
  weight: number;
};

export const routeStyleByMode: Record<StoreRouteMode, RouteStyle> = {
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

export const getTransitSegmentStyle = (
  segment: RoutePreviewSegment,
  fallbackMode: StoreRouteMode,
) => {
  // 차량·자전거 경로의 연결선은 경로 색 점선으로 얇게 그려 실제 도로 경로와 구분한다.
  // (도보·대중교통은 아래 도보 구간 스타일을 그대로 쓴다)
  if (
    segment.isConnector &&
    (fallbackMode === "car" || fallbackMode === "bicycle")
  ) {
    return {
      ...routeStyleByMode[fallbackMode],
      opacity: 0.75,
      strokeStyle: "shortdot" as const,
      weight: 5,
    };
  }

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

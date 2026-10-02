import type { MapPoint } from "@/features/store/lib/mapFit";
import type {
  StoreRouteMode,
  StoreRouteSegmentKind,
} from "@/features/store/types";

export type RoutePreview = {
  destination: MapPoint;
  mode: StoreRouteMode;
  origin: MapPoint;
  path: MapPoint[];
  routeKey: string;
  segments?: RoutePreviewSegment[];
};

export type RoutePreviewSegment = {
  color?: string;
  /** 출발지↔경로 시작점, 경로 끝점↔도착지를 잇는 연결선(API 경로 밖 구간) */
  isConnector?: boolean;
  kind: StoreRouteSegmentKind;
  lineName?: string;
  path: MapPoint[];
};

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

const getPathDistance = (from: MapPoint, to: MapPoint) => {
  const latDistance = to.lat - from.lat;
  const lngDistance = to.lng - from.lng;

  return Math.sqrt(latDistance ** 2 + lngDistance ** 2);
};

export const getPartialRoutePath = (path: MapPoint[], progress: number) => {
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

const getRoutePathDistance = (path: MapPoint[]) => {
  return path
    .slice(0, -1)
    .reduce(
      (sum, point, index) => sum + getPathDistance(point, path[index + 1]),
      0,
    );
};

export const getSequentialRouteSegments = (
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

export const getFlatTransitFallbackSegments = (path: MapPoint[]) => {
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

export const getTransferStops = (
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

    // 연결선의 양 끝은 승하차 지점이 아니므로 표시하지 않는다.
    if (segment.isConnector || nextSegment.isConnector) {
      return;
    }

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

/** 연결선을 그릴 최소 간격(위경도 차, 약 3m). 이보다 가까우면 끊겨 보이지 않으므로 잇지 않는다. */
const ROUTE_CONNECTOR_MIN_DISTANCE = 0.00003;

/**
 * API 경로는 도로(또는 정류장) 위에서 시작·끝나서 출발지·도착지와 떨어져 있을 수 있다.
 * 그 사이를 연결선 구간으로 이어 경로가 끊겨 보이지 않게 한다.
 */
const withRouteConnectors = (
  segments: RoutePreviewSegment[],
  origin: MapPoint,
  destination: MapPoint,
): RoutePreviewSegment[] => {
  const routeStart = segments[0]?.path[0];
  const lastSegmentPath = segments[segments.length - 1]?.path ?? [];
  const routeEnd = lastSegmentPath[lastSegmentPath.length - 1];

  if (!routeStart || !routeEnd) {
    return segments;
  }

  const startConnector: RoutePreviewSegment[] =
    getPathDistance(origin, routeStart) > ROUTE_CONNECTOR_MIN_DISTANCE
      ? [{ isConnector: true, kind: "walk", path: [origin, routeStart] }]
      : [];
  const endConnector: RoutePreviewSegment[] =
    getPathDistance(routeEnd, destination) > ROUTE_CONNECTOR_MIN_DISTANCE
      ? [{ isConnector: true, kind: "walk", path: [routeEnd, destination] }]
      : [];

  return [...startConnector, ...segments, ...endConnector];
};

/**
 * 지도에 그릴 경로 구간 목록.
 * 응답에 구간 정보가 있으면 그대로 쓰고, 없으면 대중교통은 도보-탑승-도보로 나눈 대체 구간을, 그 외는 경로 전체를 한 구간으로 쓴다.
 * - routePreview.path는 [출발지, ...API 경로, 도착지]다. 출발지·도착지와 API 경로 사이는 연결선으로 잇는다.
 */
export const getRoutePreviewSegments = (
  routePreview: RoutePreview,
): RoutePreviewSegment[] => {
  const { mode, path, segments } = routePreview;
  const origin = path[0];
  const destination = path[path.length - 1];

  if (segments && segments.length > 0) {
    return withRouteConnectors(segments, origin, destination);
  }

  if (mode === "transit") {
    return getFlatTransitFallbackSegments(path);
  }

  // API 경로가 있으면(출발지·도착지 사이에 2개 이상) 그 부분만 실제 경로로 그리고 양 끝은 연결선으로 잇는다.
  if (path.length >= 4) {
    return withRouteConnectors(
      [{ kind: mode, path: path.slice(1, -1) }],
      origin,
      destination,
    );
  }

  return [{ kind: mode, path }];
};

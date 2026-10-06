import type { StoreRoute, StoreRouteSegment } from "@/features/store/types";
import {
  getSegmentColor,
  getSegmentLineName,
  normalizeSegmentKind,
} from "@/features/store/lib/routeSegmentNormalize";
import type {
  RoutePointResponse,
  RouteResponse,
  RouteSegmentResponse,
} from "@/features/store/lib/storeRouteResponseTypes";

/*
 * 길찾기 API(/stores/{id}/directions) 응답 해석.
 * 백엔드가 감싸는 경로 API(TMAP·ODsay 등)마다 필드 이름이 달라, 알려진 형태를 모두 받아 경로 좌표와 구간(도보·지하철·버스 등)으로 바꾼다.
 */

export type { RouteResponse };

const getRoutePoint = (
  point: RoutePointResponse | undefined,
): StoreRoute["path"][number] | null => {
  const lat = Number(point?.lat ?? point?.latitude ?? point?.y);
  const lng = Number(point?.lng ?? point?.longitude ?? point?.x);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

/** "lng,lat lng,lat ..." 형태의 좌표 문자열을 경로 좌표로 변환한다. */
const parseLinestring = (linestring?: string) =>
  (linestring ?? "")
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [lng, lat] = pair.split(",").map(Number);

      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter((point): point is StoreRoute["path"][number] => Boolean(point));

const getRouteSegmentPath = (
  segment: RoutePointResponse | RouteSegmentResponse,
) => {
  if ("lat" in segment || "latitude" in segment || "y" in segment) {
    const point = getRoutePoint(segment);

    return point ? [point] : [];
  }

  const routeSegment = segment as RouteSegmentResponse;
  const pointPath = (
    routeSegment.path ??
    routeSegment.points ??
    routeSegment.coordinates ??
    routeSegment.passStopList?.stations ??
    []
  )
    .map(getRoutePoint)
    .filter((point): point is StoreRoute["path"][number] => Boolean(point));

  if (pointPath.length > 0) {
    return pointPath;
  }

  return parseLinestring(
    routeSegment.passShape?.linestring ?? routeSegment.linestring,
  );
};

const isRoutePointLike = (
  segment: RoutePointResponse | RouteSegmentResponse,
): segment is RoutePointResponse =>
  "lat" in segment ||
  "latitude" in segment ||
  "lng" in segment ||
  "longitude" in segment ||
  "x" in segment ||
  "y" in segment;

const isSegmentArray = (
  source: RoutePointResponse[] | RouteSegmentResponse[] | undefined,
): source is RouteSegmentResponse[] =>
  Boolean(source?.some((item) => !isRoutePointLike(item)));

export const getRoutePath = (response: RouteResponse) => {
  const routeSource =
    response.path ??
    response.paths ??
    response.routePath ??
    response.legs ??
    response.sections ??
    [];

  return routeSource.flatMap(getRouteSegmentPath);
};

const getRouteSegmentSources = (response: RouteResponse) => {
  const pathSegments = isSegmentArray(response.path) ? response.path : [];
  const pathsSegments = isSegmentArray(response.paths) ? response.paths : [];
  const routePathSegments = isSegmentArray(response.routePath)
    ? response.routePath
    : [];

  return [
    ...(response.legs ?? []),
    ...(response.sections ?? []),
    ...(response.segments ?? []),
    ...pathSegments,
    ...pathsSegments,
    ...routePathSegments,
  ];
};

export const getRouteSegments = (
  response: RouteResponse,
): StoreRouteSegment[] => {
  const routeSource = getRouteSegmentSources(response).flatMap((segment) => {
    return segment.steps ?? segment.subPath ?? segment.subPaths ?? [segment];
  });

  if (routeSource.length === 0) {
    return [];
  }

  return routeSource
    .map((segment) => ({
      kind: normalizeSegmentKind(segment),
      lineName: getSegmentLineName(segment),
      color: getSegmentColor(segment),
      path: getRouteSegmentPath(segment),
    }))
    .filter((segment) => segment.path.length > 0);
};

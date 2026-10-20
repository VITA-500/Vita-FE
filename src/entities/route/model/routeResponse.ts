import type {
  RoutePointResponse,
  RouteOptionResponse,
  RouteResponse,
  RouteSegmentResponse,
} from "@/entities/route/api/routeResponseTypes";
import {
  getSegmentColor,
  getSegmentLineName,
  normalizeSegmentKind,
} from "@/entities/route/model/routeSegmentNormalize";
import type {
  StoreRoute,
  StoreRouteSegment,
} from "@/entities/route/model/types";

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

const getNumber = (value: number | string | undefined) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getPointName = (point: RoutePointResponse | undefined) =>
  point?.name ?? point?.stationName ?? point?.stopName;

const getSegmentStartName = (segment: RouteSegmentResponse) =>
  segment.startName ??
  segment.startStationName ??
  segment.startStation ??
  segment.stops?.[0] ??
  getPointName(segment.passStopList?.stations?.[0]) ??
  getPointName(segment.path?.[0]) ??
  getPointName(segment.points?.[0]);

const getSegmentEndName = (segment: RouteSegmentResponse) => {
  const stationPoints = segment.passStopList?.stations;
  const pathPoints = segment.path ?? segment.points;

  return (
    segment.endName ??
    segment.endStationName ??
    segment.endStation ??
    segment.stops?.[segment.stops.length - 1] ??
    getPointName(stationPoints?.[stationPoints.length - 1]) ??
    getPointName(pathPoints?.[pathPoints.length - 1])
  );
};

const getSegmentDurationSeconds = (segment: RouteSegmentResponse) => {
  const seconds = getNumber(segment.durationSeconds);
  const minutes = getNumber(segment.durationMinutes ?? segment.sectionTime);

  return seconds ?? (minutes !== undefined ? minutes * 60 : undefined);
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

export const getRoutePath = (response: RouteResponse | RouteOptionResponse) => {
  const routeSource =
    response.path ??
    ("paths" in response ? response.paths : undefined) ??
    ("routePath" in response ? response.routePath : undefined) ??
    ("legs" in response ? response.legs : undefined) ??
    ("sections" in response ? response.sections : undefined) ??
    [];

  return routeSource.flatMap(getRouteSegmentPath);
};

const getRouteSegmentSources = (
  response: RouteResponse | RouteOptionResponse,
) => {
  const pathSegments = isSegmentArray(response.path) ? response.path : [];
  const pathsSegments =
    "paths" in response && isSegmentArray(response.paths) ? response.paths : [];
  const routePathSegments =
    "routePath" in response && isSegmentArray(response.routePath)
      ? response.routePath
      : [];

  return [
    ...("legs" in response ? (response.legs ?? []) : []),
    ...("sections" in response ? (response.sections ?? []) : []),
    ...(response.segments ?? []),
    ...pathSegments,
    ...pathsSegments,
    ...routePathSegments,
  ];
};

export const getRouteSegments = (
  response: RouteResponse | RouteOptionResponse,
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
      distanceMeters: getNumber(segment.distanceMeters ?? segment.distance),
      durationSeconds: getSegmentDurationSeconds(segment),
      endName: getSegmentEndName(segment),
      guidance: segment.guidance || undefined,
      path: getRouteSegmentPath(segment),
      startName: getSegmentStartName(segment),
      stops: segment.stops,
      vehicleType: segment.vehicleType || undefined,
    }))
    .filter((segment) => segment.path.length > 0);
};

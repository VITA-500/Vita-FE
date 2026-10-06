import type {
  StoreRoute,
  StoreRouteMode,
  StoreRouteSegment,
  StoreRouteSegmentKind,
} from "@/features/store/types";
import { subwayLineColors } from "@/features/store/lib/subwayLineColors";

/*
 * 길찾기 API(/stores/{id}/directions) 응답 해석.
 * 백엔드가 감싸는 경로 API(TMAP·ODsay 등)마다 필드 이름이 달라, 알려진 형태를 모두 받아 경로 좌표와 구간(도보·지하철·버스 등)으로 바꾼다.
 */

export type RouteResponse = {
  distanceMeters: number;
  durationSeconds: number;
  mode: StoreRouteMode;
  path?: RoutePointResponse[] | RouteSegmentResponse[];
  paths?: RoutePointResponse[] | RouteSegmentResponse[];
  routePath?: RoutePointResponse[] | RouteSegmentResponse[];
  legs?: RouteSegmentResponse[];
  sections?: RouteSegmentResponse[];
  segments?: RouteSegmentResponse[];
};

type RoutePointResponse = {
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  y?: number | string;
  x?: number | string;
};

type RouteLaneResponse = {
  busNo?: string;
  name?: string;
  subwayCode?: number | string;
};

type RouteSegmentResponse = {
  bus?: RouteTransitInfoResponse;
  /** ODsay 형식: 노선 정보 배열 */
  lane?: RouteLaneResponse[];
  /** TMAP 형식: "127.1,37.5 127.2,37.6" 좌표 문자열 */
  linestring?: string;
  passShape?: { linestring?: string };
  /** ODsay 형식: 정류장 좌표 목록 */
  passStopList?: { stations?: RoutePointResponse[] };
  mode?: string;
  type?: string;
  kind?: string;
  transportType?: string;
  transitType?: string;
  /** ODsay는 숫자(1 지하철, 2 버스, 3 도보)로 준다. */
  trafficType?: string | number;
  vehicleType?: string;
  line?: string;
  lineName?: string;
  name?: string;
  routeName?: string;
  subwayLine?: string;
  subwayLineName?: string;
  subway?: RouteTransitInfoResponse;
  transport?: RouteTransitInfoResponse;
  transit?: RouteTransitInfoResponse;
  color?: string;
  routeColor?: string;
  lineColor?: string;
  route?: RouteTransitInfoResponse | string;
  path?: RoutePointResponse[];
  points?: RoutePointResponse[];
  coordinates?: RoutePointResponse[];
  steps?: RouteSegmentResponse[];
  subPath?: RouteSegmentResponse[];
  subPaths?: RouteSegmentResponse[];
};

type RouteTransitInfoResponse = {
  color?: string;
  line?: string;
  lineColor?: string;
  lineName?: string;
  name?: string;
  routeColor?: string;
  routeName?: string;
  type?: string;
};

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

const normalizeSegmentKind = (
  segment: RouteSegmentResponse,
): StoreRouteSegmentKind => {
  // ODsay trafficType: 1 지하철, 2 버스, 3 도보
  const trafficTypeCode = Number(segment.trafficType);

  if (trafficTypeCode === 1) return "subway";
  if (trafficTypeCode === 2) return "bus";
  if (trafficTypeCode === 3) return "walk";

  const rawKind = String(
    segment.kind ??
      segment.mode ??
      segment.type ??
      segment.transportType ??
      segment.transitType ??
      segment.vehicleType ??
      segment.transport?.type ??
      segment.transit?.type ??
      segment.subway?.type ??
      segment.bus?.type ??
      "",
  )
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (
    rawKind.includes("walk") ||
    rawKind.includes("pedestrian") ||
    rawKind.includes("도보")
  ) {
    return "walk";
  }

  if (
    rawKind.includes("subway") ||
    rawKind.includes("metro") ||
    rawKind.includes("지하철")
  ) {
    return "subway";
  }

  if (rawKind.includes("bus") || rawKind.includes("버스")) {
    return "bus";
  }

  if (rawKind.includes("car")) {
    return "car";
  }

  if (rawKind.includes("bike") || rawKind.includes("bicycle")) {
    return "bicycle";
  }

  return "transit";
};

const normalizeColor = (color?: string) => {
  if (!color) {
    return undefined;
  }

  return color.startsWith("#") ? color : `#${color}`;
};

const getSegmentLineName = (segment: RouteSegmentResponse) =>
  segment.lineName ??
  segment.subwayLineName ??
  segment.subwayLine ??
  segment.routeName ??
  segment.line ??
  segment.name ??
  segment.transport?.lineName ??
  segment.transport?.routeName ??
  segment.transport?.line ??
  segment.transport?.name ??
  segment.transit?.lineName ??
  segment.transit?.routeName ??
  segment.transit?.line ??
  segment.transit?.name ??
  segment.subway?.lineName ??
  segment.subway?.routeName ??
  segment.subway?.line ??
  segment.subway?.name ??
  segment.bus?.lineName ??
  segment.bus?.routeName ??
  segment.bus?.line ??
  segment.bus?.name ??
  (typeof segment.route === "string"
    ? segment.route
    : (segment.route?.lineName ??
      segment.route?.routeName ??
      segment.route?.line ??
      segment.route?.name)) ??
  segment.lane?.[0]?.name ??
  segment.lane?.[0]?.busNo ??
  (segment.lane?.[0]?.subwayCode !== undefined
    ? `${segment.lane[0].subwayCode}호선`
    : undefined);

const getSegmentColor = (segment: RouteSegmentResponse) => {
  const responseColor = normalizeColor(
    segment.color ??
      segment.routeColor ??
      segment.lineColor ??
      segment.transport?.color ??
      segment.transport?.routeColor ??
      segment.transport?.lineColor ??
      segment.transit?.color ??
      segment.transit?.routeColor ??
      segment.transit?.lineColor ??
      segment.subway?.color ??
      segment.subway?.routeColor ??
      segment.subway?.lineColor ??
      segment.bus?.color ??
      segment.bus?.routeColor ??
      segment.bus?.lineColor ??
      (typeof segment.route === "string"
        ? undefined
        : (segment.route?.color ??
          segment.route?.routeColor ??
          segment.route?.lineColor)),
  );

  if (responseColor) {
    return responseColor;
  }

  const lineName = getSegmentLineName(segment);

  if (!lineName) {
    return undefined;
  }

  // 노선명으로 색을 추정하는 건 지하철만. (버스 "공항버스" 등이 지하철 색으로 오인되지 않도록)
  if (normalizeSegmentKind(segment) !== "subway") {
    return undefined;
  }

  const normalizedLineName = lineName.replace(/\s/g, "");
  const lineNumber = normalizedLineName.match(/(\d+)호선/)?.[1];

  if (lineNumber && subwayLineColors[lineNumber]) {
    return subwayLineColors[lineNumber];
  }

  if (subwayLineColors[normalizedLineName]) {
    return subwayLineColors[normalizedLineName];
  }

  // "신분당선"이 "분당"에 먼저 걸리지 않도록 긴 이름부터, 숫자 단독 키는 제외하고 비교한다.
  const matchedLineKey = Object.keys(subwayLineColors)
    .filter((lineKey) => !/^\d+$/.test(lineKey))
    .sort((first, second) => second.length - first.length)
    .find((lineKey) => normalizedLineName.includes(lineKey));

  return matchedLineKey ? subwayLineColors[matchedLineKey] : undefined;
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

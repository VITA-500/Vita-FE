import type { StoreRouteMode } from "@/features/store/types";

/** 길찾기 API(/stores/{id}/directions) 응답 형태. 경로 API(TMAP·ODsay 등)마다 다른 필드 이름을 모두 받는다. */
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

export type RoutePointResponse = {
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  y?: number | string;
  x?: number | string;
};

export type RouteLaneResponse = {
  busNo?: string;
  name?: string;
  subwayCode?: number | string;
};

export type RouteSegmentResponse = {
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

export type RouteTransitInfoResponse = {
  color?: string;
  line?: string;
  lineColor?: string;
  lineName?: string;
  name?: string;
  routeColor?: string;
  routeName?: string;
  type?: string;
};

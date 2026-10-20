/** 길찾기 이동 수단. BE directions의 mode와 같다. */
export type StoreRouteMode = "walk" | "car" | "bicycle" | "transit";

export type StoreRoutePoint = {
  lat: number;
  lng: number;
};

export type StoreRouteSegmentKind =
  "walk" | "car" | "bicycle" | "bus" | "subway" | "transit";

export type StoreRouteSegment = {
  kind: StoreRouteSegmentKind;
  lineName?: string;
  color?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  endName?: string;
  /** 안내 문구(BE guidance) */
  guidance?: string;
  path: StoreRoutePoint[];
  startName?: string;
  /** 대중교통 구간의 정차역 이름 목록 */
  stops?: string[];
  /** 버스 종류(간선·지선 등) / 지하철 종류(일반·급행) */
  vehicleType?: string;
};

export type StoreRoute = {
  distanceMeters: number;
  durationSeconds: number;
  mode: StoreRouteMode;
  path: StoreRoutePoint[];
  segments?: StoreRouteSegment[];
  options?: StoreRouteOption[];
};

export type StoreRouteOption = {
  tags: string[];
  routeType?: string;
  distanceMeters: number;
  durationSeconds: number;
  transfers?: number;
  path: StoreRoutePoint[];
  segments?: StoreRouteSegment[];
};

/** 대중교통 경로의 단계 하나(도보·버스·지하철). 상세 타임라인과 단계 목록이 쓴다. */
export type TransitRouteStep = {
  /** 하차역(정류장) 이름 */
  alightName?: string;
  /** 승차역(정류장) 이름 */
  boardName?: string;
  color?: string;
  description: string;
  /** 상세 타임라인용 이동 정보: "약 4분, 220m 이동" */
  detailMeta: string;
  /** BE 안내 문구 */
  guidance?: string;
  id: string;
  kind: "walk" | "bus" | "subway" | "transit";
  lineName: string;
  meta: string;
  /** 이 구간의 경로 좌표. 구간을 누르면 지도를 이 구간에 맞춘다. */
  path: { lat: number; lng: number }[];
  /** 버스 종류(간선·지선 등) / 지하철 종류(일반·급행) */
  vehicleType?: string;
};

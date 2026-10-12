export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  benefitBrand?: string;
  benefitCategory?: string;
  benefitDescription?: string;
  benefitId?: number;
  benefitName?: string;
  consultServices?: string[];
  phone: string;
  providedServices?: string[];
  openNow?: boolean;
  storeType?: "PHONE" | "PARTNER";
  lat: number;
  lng: number;
  distanceText?: string;
};

export type StoreRoutePoint = {
  lat: number;
  lng: number;
};

export type StoreRouteMode = "walk" | "car" | "bicycle" | "transit";

export type StoreMapInitialAction = {
  action: "select" | "route";
  activeServices?: string[];
  category?: MapCategory;
  benefitCategory?: string;
  routeMode?: StoreRouteMode;
  storeId: string;
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
};

/**
 * 영업 시간 필터. BE 주변 매장 조회의 openNow / openAt 쿼리와 맞춘다.
 * all: 조건 없음, now: 지금 영업 중, at: 그 시각("HH:mm")에 영업 중
 */
export type StoreOpenFilter =
  { mode: "all" } | { mode: "now" } | { mode: "at"; time: string };

/** 매장 지도 패널 목록 탭: 매장 / 제휴 혜택 */
export type MapCategory = "store" | "benefit";

// 매장 화면 모델과 영업 시간 필터는 entities/store로 옮겼다. 기존 import 경로 호환용 재내보내기.
export type { StoreLocation, StoreOpenFilter } from "@/entities/store";

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

/** 매장 지도 패널 목록 탭: 매장 / 제휴 혜택 */
export type MapCategory = "store" | "benefit";

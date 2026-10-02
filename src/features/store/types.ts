export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  consultServices?: string[];
  phone: string;
  providedServices?: string[];
  lat: number;
  lng: number;
  distanceText?: string;
};

export type StoreRoutePoint = {
  lat: number;
  lng: number;
};

export type StoreRouteMode = "walk" | "car" | "bicycle" | "transit";

export type StoreRouteSegmentKind =
  "walk" | "car" | "bicycle" | "bus" | "subway" | "transit";

export type StoreRouteSegment = {
  kind: StoreRouteSegmentKind;
  lineName?: string;
  color?: string;
  path: StoreRoutePoint[];
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

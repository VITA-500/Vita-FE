import type { StoreRouteMode } from "@/entities/route";

export type StoreMapInitialAction = {
  action: "select" | "route";
  activeServices?: string[];
  category?: MapCategory;
  benefitCategory?: string;
  routeMode?: StoreRouteMode;
  storeId: string;
};

/** 매장 지도 패널 목록 탭: 매장 / 제휴 혜택 */
export type MapCategory = "store" | "benefit";

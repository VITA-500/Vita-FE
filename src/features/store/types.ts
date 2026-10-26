import type { StoreRouteMode } from "@/entities/route";

export type StoreMapInitialAction = {
  /** select·route: 매장을 골라 연다. filter: 매장 없이 activeServices 조건 필터를 켜고 연다(storeId는 빈 값). */
  action: "select" | "route" | "filter";
  activeServices?: string[];
  category?: MapCategory;
  benefitCategory?: string;
  routeMode?: StoreRouteMode;
  storeId: string;
};

/** 매장 지도 패널 목록 탭: 매장 / 제휴 혜택 */
export type MapCategory = "store" | "benefit";

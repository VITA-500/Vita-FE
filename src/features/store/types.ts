// 매장 화면 모델과 영업 시간 필터는 entities/store로 옮겼다. 기존 import 경로 호환용 재내보내기.
export type { StoreLocation, StoreOpenFilter } from "@/entities/store";
// 길찾기 타입은 entities/route로 옮겼다. 기존 import 경로 호환용 재내보내기.
import type { StoreRouteMode } from "@/entities/route";
export type {
  StoreRoute,
  StoreRouteMode,
  StoreRoutePoint,
  StoreRouteSegment,
  StoreRouteSegmentKind,
} from "@/entities/route";

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

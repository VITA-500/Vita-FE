import type { StoreLocation } from "@/entities/store";

/** 같은 좌표 묶음 안의 매장과, 지도에 그린 순서(핀 글자 계산용) */
export type StoreMarkerGroupEntry = {
  index: number;
  store: StoreLocation;
};

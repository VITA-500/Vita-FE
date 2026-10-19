// 리팩토링 기간 임시 경로입니다. 새 경로: 매장 조회는 @/entities/store, 길찾기는 @/entities/route, 예약은 @/entities/reservation
// docs/Architecture.md Migration 7단계에서 삭제합니다.
import { reservationApi } from "@/entities/reservation";
import { routeApi } from "@/entities/route";
import { storeApi } from "@/entities/store";

export type { ReservationResponse } from "@/entities/reservation";

export const storeService = {
  fetchNearbyStores: storeApi.fetchNearbyStores,
  fetchStoreDetail: storeApi.fetchStoreDetail,
  fetchRoute: routeApi.fetchRoute,
  /** 매장 예약. entities/reservation으로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  reserveStore: reservationApi.createReservation,
};

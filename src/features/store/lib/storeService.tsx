// 리팩토링 기간 임시 경로입니다. 새 경로: 매장 조회는 @/entities/store, 예약은 @/entities/reservation
// 길찾기(fetchRoute)는 route entity를 만들 때 옮기고, 이 파일은 docs/Architecture.md Migration 7단계에서 삭제합니다.
import {
  getRoutePath,
  getRouteSegments,
  type RouteResponse,
} from "@/features/store/lib/storeRouteResponse";
import type { StoreRoute, StoreRouteMode } from "@/features/store/types";
import { reservationApi } from "@/entities/reservation";
import { isApiStoreId, storeApi } from "@/entities/store";
import { requestJson } from "@/shared/api/http";
import type { UserLocation } from "@/shared/lib/geo";

export type { ReservationResponse } from "@/entities/reservation";

export const storeService = {
  fetchNearbyStores: storeApi.fetchNearbyStores,
  fetchStoreDetail: storeApi.fetchStoreDetail,
  fetchRoute: async (
    storeId: string,
    location: UserLocation,
    mode: StoreRouteMode,
  ): Promise<StoreRoute> => {
    if (!isApiStoreId(storeId)) {
      throw new Error("NON_API_STORE_ID");
    }

    const params = new URLSearchParams({
      fromLat: String(location.lat),
      fromLng: String(location.lng),
      mode,
    });

    const response = await requestJson<RouteResponse>(
      `/stores/${storeId}/directions?${params.toString()}`,
      {
        timeoutMs: 7000,
      },
    );

    return {
      distanceMeters: response.distanceMeters,
      durationSeconds: response.durationSeconds,
      mode: response.mode,
      path: getRoutePath(response),
      segments: getRouteSegments(response),
    };
  },
  /** 매장 예약. entities/reservation으로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  reserveStore: reservationApi.createReservation,
};

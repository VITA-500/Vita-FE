import type { RouteResponse } from "@/entities/route/api/routeResponseTypes";
import {
  getRouteGuides,
  getRoutePath,
  getRouteSegments,
} from "@/entities/route/model/routeResponse";
import type { StoreRoute, StoreRouteMode } from "@/entities/route/model/types";
import { isApiStoreId } from "@/entities/store/@x/route";
import { requestJson } from "@/shared/api/http";
import type { LatLng } from "@/shared/lib/geo";

/** 매장 길찾기 API (/stores/{id}/directions). 응답을 지도·타임라인용 경로로 바꿔 돌려준다. */
export const routeApi = {
  fetchRoute: async (
    storeId: string,
    location: LatLng,
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
      guides: getRouteGuides(response),
      options: response.routes?.map((option) => ({
        tags: option.tags ?? [],
        routeType: option.routeType ?? undefined,
        distanceMeters: option.distanceMeters ?? 0,
        durationSeconds: option.durationSeconds ?? 0,
        transfers: option.transfers ?? undefined,
        path: getRoutePath(option),
        segments: getRouteSegments(option),
        guides: getRouteGuides(option),
      })),
    };
  },
};

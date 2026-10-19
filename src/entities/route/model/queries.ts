"use client";

import { useQuery } from "@tanstack/react-query";
import { routeApi } from "@/entities/route/api/routeApi";
import type { StoreRouteMode } from "@/entities/route/model/types";
import type { LatLng } from "@/shared/lib/geo";

export const routeQueryKeys = {
  all: ["route"] as const,
  storeRoute: (storeId: string, origin: LatLng | null, mode: StoreRouteMode) =>
    [
      ...routeQueryKeys.all,
      "store",
      { storeId, mode, lat: origin?.lat ?? null, lng: origin?.lng ?? null },
    ] as const,
};

/**
 * 매장 길찾기 경로. 도착 매장·출발 위치·이동수단이 모두 있을 때만 조회한다.
 * 같은 조건은 캐시를 써서 이동수단을 바꿨다가 돌아오면 바로 보여준다.
 * 경로 없음(BE 4xx)은 다시 시도해도 같아서 재시도하지 않는다.
 */
export const useStoreRouteQuery = ({
  mode,
  origin,
  storeId,
}: {
  mode: StoreRouteMode;
  origin: LatLng | null;
  storeId: string;
}) =>
  useQuery({
    enabled: Boolean(storeId && origin),
    queryFn: () => routeApi.fetchRoute(storeId, origin!, mode),
    queryKey: routeQueryKeys.storeRoute(storeId, origin, mode),
    retry: false,
    staleTime: 5 * 60_000,
  });

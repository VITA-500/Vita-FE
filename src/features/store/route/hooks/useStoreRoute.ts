"use client";

import { useState } from "react";
import type { StoreLocation } from "@/entities/store";
import type { StoreRouteMode } from "@/entities/route";
import { useStoreRouteQuery } from "@/entities/route";
import { getDistanceMeters, type UserLocation } from "@/shared/lib/geo";

/**
 * 길찾기 중 위치 추적으로 내 위치가 갱신될 때, 마지막으로 경로를 조회한 위치에서 이만큼(m) 이상 움직여야 다시 조회한다.
 * 가만히 있어도 GPS 오차로 위치가 수십 m씩 흔들려 경로 요청이 계속 나가는 것을 막는다.
 * 도보는 짧은 이동에도 경로가 달라지고, 차량·자전거·대중교통은 이 정도 이동으로는 결과가 거의 같다.
 */
export const ROUTE_REFETCH_DISTANCE_METERS: Record<StoreRouteMode, number> = {
  walk: 30,
  bicycle: 100,
  car: 100,
  transit: 100,
};

const noRouteResultMessage =
  "해당 교통 수단의 길찾기 결과가 없습니다.\n다른 이동 수단을 선택해주세요";

/**
 * 길찾기 상태: 도착 매장, 이동수단, 경로 조회 결과, 지도 범위 맞춤 완료 여부.
 * 도착 매장·이동수단이 바뀌면 바로, 내 위치는 이동수단별 기준 거리(ROUTE_REFETCH_DISTANCE_METERS) 이상 움직였을 때 다시 조회한다.
 * 경로 조회와 캐시는 TanStack Query(useStoreRouteQuery)가 맡고, 여기서는 조회 조건만 관리한다.
 */
export const useStoreRoute = (userLocation: UserLocation | null) => {
  const [routeDestinationStoreId, setRouteDestinationStoreId] = useState("");
  // 길찾기를 시작할 때의 도착 매장. 주변 매장 목록(stores)이 다시 조회돼 도착 매장이 빠져도
  // (예: 채팅 → 길찾기로 들어와 기본 위치·내 위치 주변 매장으로 목록이 바뀔 때) 경로를 그릴 수 있게 들고 있는다.
  const [routeDestinationSnapshot, setRouteDestinationSnapshot] =
    useState<StoreLocation | null>(null);
  const [routeMode, setRouteMode] = useState<StoreRouteMode>("walk");
  const [selectedTransitRouteIndex, setSelectedTransitRouteIndex] = useState(0);
  // 출발-경로-도착이 보이도록 지도 범위 맞춤이 끝난 경로 key(이 전까지는 탐색 중 모달을 유지)
  const [routeMapReadyKey, setRouteMapReadyKey] = useState("");
  // 경로 조회에 쓰는 출발 위치. 내 위치가 이동수단별 기준 거리 이상 움직였을 때만 바꾼다.
  const [routeOrigin, setRouteOrigin] = useState(userLocation);

  if (
    userLocation !== routeOrigin &&
    (!userLocation ||
      !routeOrigin ||
      getDistanceMeters(routeOrigin, userLocation) >=
        ROUTE_REFETCH_DISTANCE_METERS[routeMode])
  ) {
    // 렌더 중 상태 맞추기(React 권장 방식). 바뀐 뒤에는 같은 값이라 다시 들어오지 않는다.
    setRouteOrigin(userLocation);
  }

  const routeQuery = useStoreRouteQuery({
    mode: routeMode,
    origin: routeOrigin,
    storeId: routeDestinationStoreId,
  });
  const walkingRoute = routeDestinationStoreId
    ? (routeQuery.data ?? null)
    : null;
  const selectedRoute =
    routeMode === "transit" && walkingRoute?.options?.length
      ? (() => {
          const option =
            walkingRoute.options[
              Math.min(
                selectedTransitRouteIndex,
                walkingRoute.options.length - 1,
              )
            ];
          return {
            ...walkingRoute,
            distanceMeters: option.distanceMeters,
            durationSeconds: option.durationSeconds,
            path: option.path,
            segments: option.segments,
            guides: option.guides,
          };
        })()
      : walkingRoute;
  const routeResultMessage =
    routeDestinationStoreId && routeQuery.isError ? noRouteResultMessage : null;
  // 위치를 아직 못 받았으면(권한 확인·위치 조회 중) 경로를 기다리는 중으로 본다.
  const isRouteLoading = Boolean(
    routeDestinationStoreId && (!routeOrigin || routeQuery.isFetching),
  );

  /** 길찾기 시작: 이전 경로를 비우고 새 도착 매장으로 경로 조회를 시작한다. */
  const startRoute = (store: StoreLocation) => {
    setRouteMapReadyKey("");
    setRouteDestinationStoreId(store.id);
    setRouteDestinationSnapshot(store);
    setSelectedTransitRouteIndex(0);
  };
  const changeRouteMode = (nextMode: StoreRouteMode) => {
    setRouteMapReadyKey("");
    setRouteMode(nextMode);
    setSelectedTransitRouteIndex(0);
  };
  const selectTransitRoute = (index: number) => {
    setSelectedTransitRouteIndex(Math.max(0, index));
  };
  const resetRouteState = () => {
    setRouteMapReadyKey("");
    setRouteDestinationStoreId("");
    setRouteDestinationSnapshot(null);
  };

  return {
    changeRouteMode,
    isRouteLoading,
    resetRouteState,
    routeDestinationSnapshot,
    routeDestinationStoreId,
    routeMapReadyKey,
    routeMode,
    routeResultMessage,
    setRouteMapReadyKey,
    startRoute,
    walkingRoute: selectedRoute,
    selectTransitRoute,
    selectedTransitRouteIndex,
  };
};

"use client";

import { useEffect, useState } from "react";
import type { UserLocation } from "@/features/store/lib/geo";
import { storeService } from "@/features/store/lib/storeService";
import type {
  StoreLocation,
  StoreRoute,
  StoreRouteMode,
} from "@/features/store/types";

const noRouteResultMessage =
  "해당 교통 수단의 길찾기 결과가 없습니다.\n다른 이동 수단을 선택해주세요";

/**
 * 길찾기 상태: 도착 매장, 이동수단, 경로 조회 결과, 지도 범위 맞춤 완료 여부.
 * 도착 매장·이동수단·내 위치가 바뀔 때마다 경로를 다시 조회한다.
 */
export const useStoreRoute = (userLocation: UserLocation | null) => {
  const [routeDestinationStoreId, setRouteDestinationStoreId] = useState("");
  // 길찾기를 시작할 때의 도착 매장. 주변 매장 목록(stores)이 다시 조회돼 도착 매장이 빠져도
  // (예: 채팅 → 길찾기로 들어와 기본 위치·내 위치 주변 매장으로 목록이 바뀔 때) 경로를 그릴 수 있게 들고 있는다.
  const [routeDestinationSnapshot, setRouteDestinationSnapshot] =
    useState<StoreLocation | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<StoreRoute | null>(null);
  const [routeMode, setRouteMode] = useState<StoreRouteMode>("walk");
  const [routeResultMessage, setRouteResultMessage] = useState<string | null>(
    null,
  );
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  // 출발-경로-도착이 보이도록 지도 범위 맞춤이 끝난 경로 key(이 전까지는 탐색 중 모달을 유지)
  const [routeMapReadyKey, setRouteMapReadyKey] = useState("");

  /** 길찾기 시작: 이전 경로를 비우고 새 도착 매장으로 경로 조회를 시작한다. */
  const startRoute = (store: StoreLocation) => {
    setRouteMapReadyKey("");
    setRouteDestinationStoreId(store.id);
    setRouteDestinationSnapshot(store);
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(true);
  };
  const changeRouteMode = (nextMode: StoreRouteMode) => {
    setRouteMapReadyKey("");
    setRouteMode(nextMode);
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(Boolean(routeDestinationStoreId));
  };
  const resetRouteState = () => {
    setRouteMapReadyKey("");
    setRouteDestinationStoreId("");
    setRouteDestinationSnapshot(null);
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(false);
  };

  useEffect(() => {
    if (!routeDestinationStoreId || !userLocation) {
      return;
    }

    let isCurrentRequest = true;

    storeService
      .fetchRoute(routeDestinationStoreId, userLocation, routeMode)
      .then((route) => {
        if (isCurrentRequest) {
          setWalkingRoute(route);
          setRouteResultMessage(null);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setWalkingRoute(null);
          setRouteResultMessage(noRouteResultMessage);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsRouteLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [routeDestinationStoreId, routeMode, userLocation]);

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
    walkingRoute,
  };
};

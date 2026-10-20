"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  fitMapToRoute,
  getCenterPlacingPointAt,
  getRouteFitPadding,
  getRouteVisiblePadding,
  type KakaoMapWithProjection,
} from "@/features/store/map/lib/mapFit";
import type { RoutePreview } from "@/features/store/route/lib/mapRoute";

type UseRouteRefocusParams = {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  routeDrawProgress: number;
  routeLeftInset: number;
  /** 모바일 바텀 시트가 덮는 아래쪽 높이(px) */
  routeBottomInset: number;
  routePreview?: RoutePreview | null;
  selectedStoreCard?: ReactNode;
  selectedStoreCardLeftInset: number;
  selectedStoreCardRef: RefObject<HTMLDivElement | null>;
};

/** 경로를 다 그린 뒤 경로가 화면(여백 제외 영역)에 온전히 보이지 않으면 다시 초점을 맞춘다. */
export const useRouteRefocus = ({
  mapContainerRef,
  mapRef,
  routeDrawProgress,
  routeLeftInset,
  routeBottomInset,
  routePreview,
  selectedStoreCard,
  selectedStoreCardLeftInset,
  selectedStoreCardRef,
}: UseRouteRefocusParams) => {
  // 경로 그리기가 끝난 뒤 초점 보정을 마친 경로 key
  const refocusedRouteKeyRef = useRef("");

  /**
   * 경로 그리기 애니메이션이 끝났을 때 경로가 화면(여백 제외 영역)에 온전히 보이지 않으면 다시 초점을 맞춘다.
   * (그리는 도중 사용자가 지도를 움직였거나, 실제 경로가 도착해 모양이 바뀐 경우)
   * - 현재 확대 수준에서 들어가면 부드럽게 이동(panTo)만 하고
   * - 들어가지 않으면 경로 전체가 보이도록 범위를 다시 맞춘다.
   */
  const isRouteDrawn = routeDrawProgress >= 1;
  const drawnRouteKey = routePreview?.routeKey ?? "";

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;
    const projection = map
      ? (map as KakaoMapWithProjection).getProjection?.()
      : undefined;
    const containerRect = mapContainerRef.current?.getBoundingClientRect();

    if (
      !isRouteDrawn ||
      !routePreview ||
      !map ||
      !kakaoMaps ||
      !projection?.containerPointFromCoords ||
      !containerRect ||
      refocusedRouteKeyRef.current === drawnRouteKey
    ) {
      return;
    }

    refocusedRouteKeyRef.current = drawnRouteKey;

    const padding = getRouteFitPadding({
      cardElement: selectedStoreCardRef.current,
      containerWidth:
        mapContainerRef.current?.getBoundingClientRect().width ?? 0,
      hasStoreCard: Boolean(selectedStoreCard),
      routeLeftInset,
      routeBottomInset,
      selectedStoreCardLeftInset,
    });
    const routePoints = [
      routePreview.origin,
      routePreview.destination,
      ...routePreview.path,
    ];
    const screenPoints = routePoints
      .map((point) =>
        projection.containerPointFromCoords?.(
          new kakaoMaps.LatLng(point.lat, point.lng),
        ),
      )
      .filter((point): point is { x: number; y: number } => Boolean(point));

    if (screenPoints.length === 0) {
      return;
    }

    const minX = Math.min(...screenPoints.map((point) => point.x));
    const maxX = Math.max(...screenPoints.map((point) => point.x));
    const minY = Math.min(...screenPoints.map((point) => point.y));
    const maxY = Math.max(...screenPoints.map((point) => point.y));
    // 가까운 경로는 범위 맞춤에서 더 확대해 둘 수 있으므로(fitMapToRoute), 보이는지 판단도 같은 좁은 여백으로 한다.
    // 왼쪽은 펼친 사이드바를 피하는 여백을 그대로 쓴다.
    const visiblePadding = getRouteVisiblePadding(padding, containerRect.width);
    const freeLeft = visiblePadding.left;
    const freeRight = containerRect.width - visiblePadding.right;
    const freeTop = visiblePadding.top;
    const freeBottom = containerRect.height - visiblePadding.bottom;
    const isFullyVisible =
      minX >= freeLeft &&
      maxX <= freeRight &&
      minY >= freeTop &&
      maxY <= freeBottom;

    if (isFullyVisible) {
      return;
    }

    const fitsAtCurrentLevel =
      maxX - minX <= freeRight - freeLeft &&
      maxY - minY <= freeBottom - freeTop;

    if (fitsAtCurrentLevel && map.panTo) {
      const latitudes = routePoints.map((point) => point.lat);
      const longitudes = routePoints.map((point) => point.lng);
      const routeCenter = {
        lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
        lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      };
      const nextCenter = getCenterPlacingPointAt(
        map,
        routeCenter,
        { x: (freeLeft + freeRight) / 2, y: (freeTop + freeBottom) / 2 },
        { height: containerRect.height, width: containerRect.width },
      );

      if (nextCenter) {
        map.panTo(nextCenter);
        return;
      }
    }

    // 너무 확대·축소되지 않게 확대 수준 한계 안에서 맞춘다.
    fitMapToRoute(map, routePoints, padding, containerRect);
    // 경로 모양이 바뀔 때만 다시 맞춘다(지도를 직접 옮겨 보는 것은 막지 않도록 한 번만 실행)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteDrawn, drawnRouteKey]);
};

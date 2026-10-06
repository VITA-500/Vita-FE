"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  getCenterPlacingPointAt,
  getRouteFitPadding,
  type KakaoMapWithProjection,
} from "@/features/store/lib/mapFit";
import type { RoutePreview } from "@/features/store/lib/mapRoute";

type UseRouteRefocusParams = {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  routeDrawProgress: number;
  routeLeftInset: number;
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
    const freeLeft = padding.left;
    const freeRight = containerRect.width - padding.right;
    const freeTop = padding.top;
    const freeBottom = containerRect.height - padding.bottom;
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

    const bounds = new kakaoMaps.LatLngBounds();

    routePoints.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    map.setBounds(
      bounds,
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    );
    // 경로 모양이 바뀔 때만 다시 맞춘다(지도를 직접 옮겨 보는 것은 막지 않도록 한 번만 실행)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteDrawn, drawnRouteKey]);
};

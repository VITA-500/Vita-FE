"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import {
  fitMapToRoute,
  getCenterPlacingPointAt,
  getRouteFitPadding,
} from "@/features/store/lib/mapFit";
import type { RoutePreview } from "@/features/store/lib/mapRoute";
import type { StoreMapPreviewProps } from "@/features/store/lib/storeMapPreviewTypes";

/** 대중교통 하차역 한 곳을 눌렀을 때 맞출 확대 수준(카카오 level, 작을수록 확대) */
const ROUTE_POINT_FOCUS_LEVEL = 3;
/** 바텀 시트가 움직인 뒤(애니메이션 300ms) 경로를 다시 맞추기까지 기다리는 시간(ms) */
const ROUTE_REFIT_AFTER_SHEET_MOVE_MS = 340;

type UseRouteViewportEffectsParams = {
  isKakaoMapReady: boolean;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  routeBottomInset: number;
  routeFocusTarget: StoreMapPreviewProps["routeFocusTarget"];
  routeLeftInset: number;
  routePreview: RoutePreview | null | undefined;
  selectedStoreCardLeftInset: number;
};

export const useRouteViewportEffects = ({
  isKakaoMapReady,
  mapContainerRef,
  mapRef,
  routeBottomInset,
  routeFocusTarget,
  routeLeftInset,
  routePreview,
  selectedStoreCardLeftInset,
}: UseRouteViewportEffectsParams) => {
  useEffect(() => {
    if (!routePreview || !isKakaoMapReady) return;

    const timeoutId = window.setTimeout(() => {
      const map = mapRef.current;
      const containerRect = mapContainerRef.current?.getBoundingClientRect();

      if (!map || !containerRect) return;

      fitMapToRoute(
        map,
        [routePreview.origin, routePreview.destination, ...routePreview.path],
        getRouteFitPadding({
          cardElement: null,
          containerWidth: containerRect.width,
          hasStoreCard: false,
          routeBottomInset,
          routeLeftInset,
          selectedStoreCardLeftInset,
        }),
        containerRect,
      );
    }, ROUTE_REFIT_AFTER_SHEET_MOVE_MS);

    return () => window.clearTimeout(timeoutId);
    // 시트 높이가 바뀔 때만 다시 맞춘다(경로가 새로 오면 지도 effect가 맞춘다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeBottomInset]);

  const routeFocusKey = routeFocusTarget?.key;

  useEffect(() => {
    const points = routeFocusTarget?.points ?? [];
    const map = mapRef.current;
    const containerRect = mapContainerRef.current?.getBoundingClientRect();

    if (!routeFocusKey || points.length === 0 || !map || !containerRect) {
      return;
    }

    const padding = getRouteFitPadding({
      cardElement: null,
      containerWidth: containerRect.width,
      hasStoreCard: false,
      routeBottomInset,
      routeLeftInset,
      selectedStoreCardLeftInset,
    });

    if (points.length === 1) {
      const nextLevel = Math.min(map.getLevel(), ROUTE_POINT_FOCUS_LEVEL);

      map.setLevel(nextLevel);

      const nextCenter = getCenterPlacingPointAt(
        map,
        points[0],
        {
          x: (padding.left + containerRect.width - padding.right) / 2,
          y: (padding.top + containerRect.height - padding.bottom) / 2,
        },
        containerRect,
      );

      if (nextCenter) {
        map.panTo?.(nextCenter);
      }
      return;
    }

    fitMapToRoute(map, points, padding, containerRect);
    // 구간을 누를 때(key가 바뀔 때)만 맞춘다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFocusKey]);
};

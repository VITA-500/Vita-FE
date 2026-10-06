"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  getPartialRoutePath,
  getRoutePreviewSegments,
  getSequentialRouteSegments,
  getTransitSegmentStyle,
  getTransferStops,
  routeStyleByMode,
  type RoutePreview,
} from "@/features/store/lib/mapRoute";
import {
  createRouteDestinationElement,
  createRouteHeadElement,
  createRouteOriginElement,
  createTransferStopElement,
} from "@/features/store/lib/routeMarkerElements";
import { createRoutePointOverlay } from "@/features/store/lib/storeMarkerOverlays";

type UseRouteOverlaysParams = {
  isKakaoMapReady: boolean;
  mapRef: RefObject<KakaoMap | null>;
  /** 경로 그리기 애니메이션 진행도(0~1) */
  routeDrawProgress: number;
  /** 지도 범위 맞춤이 끝나 경로를 그려도 되는 경로 key */
  routeFitReadyKey: string;
  routePreview?: RoutePreview | null;
};

/** 길찾기 경로를 지도에 그린다: 진행도만큼의 경로선, 환승 지점, 출발점, (다 그리면) 도착점, 진행 지점. */
export const useRouteOverlays = ({
  isKakaoMapReady,
  mapRef,
  routeDrawProgress,
  routeFitReadyKey,
  routePreview,
}: UseRouteOverlaysParams) => {
  const routeOverlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const routeLineRefs = useRef<KakaoPolyline[]>([]);

  useEffect(() => {
    if (!isKakaoMapReady || !window.kakao?.maps || !mapRef.current) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const map = mapRef.current;

    routeLineRefs.current.forEach((line) => line.setMap(null));
    routeLineRefs.current = [];
    routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
    routeOverlayRefs.current = [];

    // 지도 공간이 확보되기 전에는 경로(선·출발/도착 표시)를 그리지 않는다.
    if (!routePreview || routeFitReadyKey !== routePreview.routeKey) {
      return;
    }

    const routeStyle = routeStyleByMode[routePreview.mode];
    const routeSegments = getRoutePreviewSegments(routePreview);
    const animatedRouteSegments = getSequentialRouteSegments(
      routeSegments,
      routeDrawProgress,
    );
    const transferStops = getTransferStops(
      routeSegments,
      routePreview.mode,
    ).filter((stop) => routeDrawProgress >= stop.progress);
    const animatedRoutePath = getPartialRoutePath(
      routePreview.path,
      routeDrawProgress,
    );
    const routeHead = animatedRoutePath[animatedRoutePath.length - 1];

    animatedRouteSegments.forEach((segment, index) => {
      const segmentStyle = getTransitSegmentStyle(segment, routePreview.mode);

      routeLineRefs.current.push(
        new kakaoMaps.Polyline({
          clickable: false,
          map,
          path: segment.path.map(
            (point) => new kakaoMaps.LatLng(point.lat, point.lng),
          ),
          strokeColor: segmentStyle.color,
          strokeOpacity: segmentStyle.opacity,
          strokeStyle: segmentStyle.strokeStyle,
          strokeWeight: segmentStyle.weight,
          zIndex: 35 + index,
        }),
      );
    });

    transferStops.forEach((stop) => {
      routeOverlayRefs.current.push(
        createRoutePointOverlay({
          content: createTransferStopElement(stop.color),
          kakaoMaps,
          map,
          point: stop.point,
          zIndex: 43,
        }),
      );
    });

    routeOverlayRefs.current.push(
      createRoutePointOverlay({
        content: createRouteOriginElement(routeStyle.color),
        kakaoMaps,
        map,
        point: routePreview.path[0],
        zIndex: 36,
      }),
    );

    if (routeDrawProgress >= 1) {
      routeOverlayRefs.current.push(
        createRoutePointOverlay({
          content: createRouteDestinationElement(routeStyle.color),
          kakaoMaps,
          map,
          point: routePreview.path[routePreview.path.length - 1],
          yAnchor: 1,
          zIndex: 38,
        }),
      );
    }

    if (routeHead && routeDrawProgress < 1) {
      routeOverlayRefs.current.push(
        createRoutePointOverlay({
          content: createRouteHeadElement(routeStyle),
          kakaoMaps,
          map,
          point: routeHead,
          zIndex: 42,
        }),
      );
    }

    return () => {
      routeLineRefs.current.forEach((line) => line.setMap(null));
      routeLineRefs.current = [];
      routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
      routeOverlayRefs.current = [];
    };
    // ref·setter는 항상 같은 값이라 의존성에 넣어도 기존과 같은 시점에만 다시 실행된다.
  }, [
    isKakaoMapReady,
    mapRef,
    routeDrawProgress,
    routeFitReadyKey,
    routePreview,
  ]);
};

"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  arePointsInFreeArea,
  fitPointsSmoothlyOnMap,
  getDefaultPinFitPadding,
  type MapFitPadding,
  type MapPoint,
  ZOOM_ANIMATION_MS,
} from "@/features/store/map/lib/mapFit";
import type { StoreLocation } from "@/entities/store";

/** 새 핀이 꽂히거나 목록을 펼친 뒤 가림 여부를 확인하기까지 기다리는 시간(ms) */
const PIN_AUTO_FIT_DELAY_MS = 160;

type UseMapFitTargetParams = {
  fitTarget?: {
    key: string;
    points: MapPoint[];
    smooth?: boolean;
    zoomLevel?: number;
    includeUserLocation?: boolean;
  } | null;
  getPinFitPaddingRef: RefObject<
    | ((container: { height: number; width: number }) => MapFitPadding | null)
    | undefined
  >;
  isKakaoMapReady: boolean;
  isPinAutoFitPausedRef: RefObject<boolean>;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  pinAutoFitKey: string;
  routeLeftInset: number;
  routeLeftInsetRef: RefObject<number>;
  shouldSkipPinAutoFitRef: RefObject<(() => boolean) | undefined>;
  storesRef: RefObject<StoreLocation[]>;
  userLocation?: MapPoint | null;
};

/** 지도 범위 계산에 현재 위치와 현재 페이지 매장 좌표를 함께 사용한다. */
export const buildMapFitPoints = (
  storePoints: MapPoint[],
  userLocation?: MapPoint | null,
) => (userLocation ? [userLocation, ...storePoints] : storePoints);

/**
 * 지도 범위 맞춤: 검색 결과·페이지 전환 때 지정한 지점들이 모두 보이게 하고(fitTarget),
 * 새 핀 묶음·목록 펼침/접힘 때 가장 바깥 핀이 패널에 가리면 지도를 옮긴다(pinAutoFitKey).
 */
export const useMapFitTarget = ({
  fitTarget,
  getPinFitPaddingRef,
  isKakaoMapReady,
  isPinAutoFitPausedRef,
  mapContainerRef,
  mapRef,
  pinAutoFitKey,
  routeLeftInset,
  routeLeftInsetRef,
  shouldSkipPinAutoFitRef,
  storesRef,
  userLocation,
}: UseMapFitTargetParams) => {
  const fitZoomTimeoutRef = useRef<number | undefined>(undefined);
  const fittedTargetKeyRef = useRef("");

  useEffect(
    () => () => {
      window.clearTimeout(fitZoomTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;

    if (
      !map ||
      !kakaoMaps ||
      !fitTarget ||
      fitTarget.points.length === 0 ||
      fittedTargetKeyRef.current === fitTarget.key
    ) {
      return;
    }

    fittedTargetKeyRef.current = fitTarget.key;
    window.clearTimeout(fitZoomTimeoutRef.current);
    const fitPoints =
      fitTarget.includeUserLocation === true
        ? buildMapFitPoints(fitTarget.points, userLocation)
        : fitTarget.points;

    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    const container = {
      height: containerRect?.height ?? 0,
      width: containerRect?.width ?? 0,
    };
    // 목록 펼침 여부에 따라 가리는 영역이 달라지므로 맞추는 순간의 여백을 쓴다.
    const padding =
      getPinFitPaddingRef.current?.(container) ??
      getDefaultPinFitPadding(container.width, routeLeftInset);

    if (
      fitTarget.smooth &&
      fitPointsSmoothlyOnMap(
        map,
        fitPoints,
        container,
        padding,
        ZOOM_ANIMATION_MS,
        (timeoutId) => {
          fitZoomTimeoutRef.current = timeoutId;
        },
      )
    ) {
      return;
    }

    if (fitPoints.length === 1) {
      const [point] = fitPoints;

      map.setCenter(new kakaoMaps.LatLng(point.lat, point.lng));
      map.setLevel(fitTarget.zoomLevel ?? 4);
      return;
    }

    const bounds = new kakaoMaps.LatLngBounds();

    fitPoints.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    // 검색창·매장 목록(펼친 경우)·지도 컨트롤에 가리지 않도록 여백을 둔다.
    map.setBounds(
      bounds,
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    );
    // ref·setter는 항상 같은 값이라 의존성에 넣어도 기존과 같은 시점에만 다시 실행된다.
  }, [
    fitTarget,
    getPinFitPaddingRef,
    isKakaoMapReady,
    mapContainerRef,
    mapRef,
    routeLeftInset,
    userLocation,
  ]);

  /**
   * 새 핀 묶음이 꽂히거나 매장 목록을 펼치고 접을 때:
   * 가장 바깥 핀까지 검색창·목록 패널에 가리지 않는지 보고, 가리면 지도를 부드럽게 옮긴다(필요하면 축소).
   * 이미 다 보이면 지도를 건드리지 않는다.
   */
  useEffect(() => {
    if (!pinAutoFitKey || !isKakaoMapReady) {
      return;
    }

    // 목록 패널이 그려져 크기를 잴 수 있고, 핀이 자리 잡은 뒤에 확인한다.
    const timeoutId = window.setTimeout(() => {
      const map = mapRef.current;
      const containerRect = mapContainerRef.current?.getBoundingClientRect();
      const storePoints = storesRef.current.map((store) => ({
        lat: store.lat,
        lng: store.lng,
      }));
      // 일반 지도 페이지에서는 위치 조회가 늦게 끝나도 사용자가 보던 화면을
      // 현재 위치 기준으로 다시 맞추지 않는다. 현재 위치를 함께 맞춰야 하는
      // 화면은 fitTarget에서 명시적으로 includeUserLocation을 사용한다.
      const points = storePoints;

      if (
        !map ||
        !containerRect ||
        points.length === 0 ||
        isPinAutoFitPausedRef.current ||
        shouldSkipPinAutoFitRef.current?.()
      ) {
        return;
      }

      const container = {
        height: containerRect.height,
        width: containerRect.width,
      };
      const padding =
        getPinFitPaddingRef.current?.(container) ??
        getDefaultPinFitPadding(container.width, routeLeftInsetRef.current);

      if (arePointsInFreeArea(map, points, container, padding)) {
        return;
      }

      window.clearTimeout(fitZoomTimeoutRef.current);
      fitPointsSmoothlyOnMap(
        map,
        points,
        container,
        padding,
        ZOOM_ANIMATION_MS,
        (zoomId) => {
          fitZoomTimeoutRef.current = zoomId;
        },
      );
    }, PIN_AUTO_FIT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // ref·setter는 항상 같은 값이라 의존성에 넣어도 기존과 같은 시점에만 다시 실행된다.
  }, [
    getPinFitPaddingRef,
    isKakaoMapReady,
    isPinAutoFitPausedRef,
    mapContainerRef,
    mapRef,
    pinAutoFitKey,
    routeLeftInsetRef,
    shouldSkipPinAutoFitRef,
    storesRef,
    userLocation,
  ]);
};

"use client";

import { useEffect, type RefObject } from "react";
import {
  getCenterPlacingPointAt,
  type KakaoMapWithProjection,
  type MapFitPadding,
} from "@/features/store/map/lib/mapFit";
import type { StoreLocation } from "@/entities/store";

/** 패널이 밀려 나오는 애니메이션(300ms)이 끝난 뒤 핀 위치를 잰다. */
const PIN_VISIBLE_CHECK_DELAY_MS = 340;
/** 핀은 좌표 지점에서 위로 46px 솟으므로, 핀 머리까지 보이도록 위쪽을 그만큼 더 비운다. */
const PIN_HEAD_HEIGHT = 46;

type UseKeepSelectedPinVisibleParams = {
  isKakaoMapReady: boolean;
  /** true면 확인하지 않는다(길찾기 중에는 경로 범위 맞춤이 지도를 맞춘다). */
  isPaused: boolean;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  /** 핀이 보여야 하는 영역(지도 기준, 좌측 사이드바·바텀 시트·검색창을 뺀 나머지). 없으면 확인하지 않는다. */
  safeArea?: MapFitPadding | null;
  selectedStore?: StoreLocation;
};

/**
 * 선택한 매장 핀이 좌측 사이드바(데스크톱)나 바텀 시트(모바일)에 가려 있으면,
 * 가리지 않는 영역의 가운데로 지도를 부드럽게 옮긴다. 이미 보이면 지도를 움직이지 않는다.
 */
export const useKeepSelectedPinVisible = ({
  isKakaoMapReady,
  isPaused,
  mapContainerRef,
  mapRef,
  safeArea,
  selectedStore,
}: UseKeepSelectedPinVisibleParams) => {
  const safeTop = safeArea?.top;
  const safeRight = safeArea?.right;
  const safeBottom = safeArea?.bottom;
  const safeLeft = safeArea?.left;
  const storeLat = selectedStore?.lat;
  const storeLng = selectedStore?.lng;

  useEffect(() => {
    if (
      !isKakaoMapReady ||
      isPaused ||
      safeTop === undefined ||
      safeRight === undefined ||
      safeBottom === undefined ||
      safeLeft === undefined ||
      storeLat === undefined ||
      storeLng === undefined
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const map = mapRef.current;
      const container = mapContainerRef.current;
      const kakaoMaps = window.kakao?.maps;
      const projection = (
        map as KakaoMapWithProjection | null
      )?.getProjection?.();

      if (
        !map ||
        !container ||
        !kakaoMaps ||
        !projection?.containerPointFromCoords
      ) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const minX = safeLeft;
      const maxX = rect.width - safeRight;
      const minY = safeTop + PIN_HEAD_HEIGHT;
      const maxY = rect.height - safeBottom;

      // 남은 영역이 없을 만큼 좁으면 옮겨도 소용없다.
      if (maxX <= minX || maxY <= minY) {
        return;
      }

      const pinPoint = projection.containerPointFromCoords(
        new kakaoMaps.LatLng(storeLat, storeLng),
      );
      const isVisible =
        pinPoint.x >= minX &&
        pinPoint.x <= maxX &&
        pinPoint.y >= minY &&
        pinPoint.y <= maxY;

      if (isVisible) {
        return;
      }

      const nextCenter = getCenterPlacingPointAt(
        map,
        { lat: storeLat, lng: storeLng },
        { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        rect,
      );

      if (!nextCenter) {
        return;
      }

      if (map.panTo) {
        map.panTo(nextCenter);
      } else {
        map.setCenter(nextCenter);
      }
    }, PIN_VISIBLE_CHECK_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    isKakaoMapReady,
    isPaused,
    mapContainerRef,
    mapRef,
    safeBottom,
    safeLeft,
    safeRight,
    safeTop,
    storeLat,
    storeLng,
  ]);
};

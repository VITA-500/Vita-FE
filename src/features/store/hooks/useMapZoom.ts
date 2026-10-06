"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  getCenterPlacingPointAt,
  getStoreCardHeight,
  getStoreCardTopInset,
  STORE_CARD_MARKER_GAP,
  ZOOM_ANIMATION_MS,
} from "@/features/store/lib/mapFit";
import type { RoutePreview } from "@/features/store/lib/mapRoute";
import type { StoreLocation } from "@/features/store/types";

/** 길찾기 중 확대/축소 전에 초점 지점으로 지도를 미리 옮기는 시간(ms, 카카오 panTo 애니메이션 여유 포함) */
const ZOOM_FOCUS_PAN_MS = 280;

type UseMapZoomParams = {
  /** 확대/축소 버튼 직후에만 카드 위치 자동 보정(지도 밀기)을 하기 위한 표시 */
  autoFitCardAfterZoomRef: RefObject<boolean>;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  routeLeftInset: number;
  routePreview?: RoutePreview | null;
  selectedStore?: StoreLocation;
  selectedStoreCard?: ReactNode;
  selectedStoreCardLeftInset: number;
  selectedStoreCardRef: RefObject<HTMLDivElement | null>;
};

/**
 * 확대/축소 버튼. 길찾기 중에는 도착 매장(확대) 또는 경로 전체 가운데(축소)를 초점으로
 * 먼저 부드럽게 옮긴 뒤 확대/축소하고, 그동안 정보 카드를 잠시 흐리게 한다(isMapAnimating).
 */
export const useMapZoom = ({
  autoFitCardAfterZoomRef,
  mapContainerRef,
  mapRef,
  routeLeftInset,
  routePreview,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLeftInset,
  selectedStoreCardRef,
}: UseMapZoomParams) => {
  const zoomFocusTimeoutRef = useRef<number | undefined>(undefined);
  const zoomSettleTimeoutRef = useRef<number | undefined>(undefined);
  const [isMapAnimating, setIsMapAnimating] = useState(false);

  useEffect(
    () => () => {
      window.clearTimeout(zoomFocusTimeoutRef.current);
      window.clearTimeout(zoomSettleTimeoutRef.current);
    },
    [],
  );

  const adjustZoomLevel = (direction: "in" | "out") => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentLevel = map.getLevel();
    const nextLevel =
      direction === "in"
        ? Math.max(1, currentLevel - 1)
        : Math.min(14, currentLevel + 1);

    if (nextLevel === currentLevel) {
      return;
    }

    // 버튼 확대/축소가 끝나면(idle) 카드가 화면 밖으로 나갔는지 한 번 보정한다.
    autoFitCardAfterZoomRef.current = true;

    const containerRect = mapContainerRef.current?.getBoundingClientRect();

    // 길찾기 중이 아니면 기본 동작(지도 중심 기준 확대/축소)
    if (!routePreview || routePreview.path.length === 0 || !containerRect) {
      map.setLevel(nextLevel, { animate: { duration: ZOOM_ANIMATION_MS } });
      return;
    }

    // 길찾기 중: 확대는 도착 매장(정보 카드가 떠 있으면 카드 포함), 축소는 경로 전체 가운데를 초점으로 잡아
    // 확대/축소 후 경로와 카드가 검색 패널·카드에 가리지 않는 영역 가운데에 오도록 부드럽게 옮긴다.
    const isDesktop = containerRect.width >= 768;
    const leftInset = isDesktop
      ? Math.max(selectedStoreCardLeftInset, routeLeftInset + 16)
      : 0;
    const topInset = getStoreCardTopInset(containerRect.width);
    const isCardVisible = Boolean(selectedStore && selectedStoreCard);
    const cardSpace = isCardVisible
      ? getStoreCardHeight(selectedStoreCardRef.current, 240) +
        STORE_CARD_MARKER_GAP
      : 0;
    const latitudes = routePreview.path.map((point) => point.lat);
    const longitudes = routePreview.path.map((point) => point.lng);
    const routeCenter = {
      lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
    const focusOnDestination = direction === "in";
    const focusPoint = focusOnDestination
      ? routePreview.destination
      : routeCenter;
    const target = {
      x: leftInset + (containerRect.width - leftInset) / 2,
      // 도착 매장에 초점을 둘 때는 핀 위 카드 자리까지 감안해 핀을 아래로 내린다.
      y: focusOnDestination
        ? (topInset + containerRect.height) / 2 + cardSpace / 2
        : (topInset + cardSpace + containerRect.height) / 2,
    };

    // 부드럽게: ① 현재 확대 수준에서 초점 지점을 목표 위치로 먼저 천천히 옮기고(panTo)
    //          ② 그 지점을 기준점(anchor)으로 확대/축소해 초점이 화면에서 움직이지 않게 한다.
    // 이동 중에는 정보 카드를 잠시 흐리게 해 지도와 따로 노는 것처럼 보이지 않게 한다.
    window.clearTimeout(zoomFocusTimeoutRef.current);
    window.clearTimeout(zoomSettleTimeoutRef.current);
    setIsMapAnimating(true);

    const nextCenter = getCenterPlacingPointAt(map, focusPoint, target, {
      height: containerRect.height,
      width: containerRect.width,
    });

    if (nextCenter) {
      map.panTo?.(nextCenter);
    }

    zoomFocusTimeoutRef.current = window.setTimeout(
      () => {
        const kakaoMaps = window.kakao?.maps;

        // 앞선 초점 이동(panTo)의 idle에서 표시가 소비됐을 수 있으므로 확대/축소 직전에 다시 켠다.
        autoFitCardAfterZoomRef.current = true;
        map.setLevel(nextLevel, {
          anchor: kakaoMaps
            ? new kakaoMaps.LatLng(focusPoint.lat, focusPoint.lng)
            : undefined,
          animate: { duration: ZOOM_ANIMATION_MS },
        });

        zoomSettleTimeoutRef.current = window.setTimeout(() => {
          setIsMapAnimating(false);
        }, ZOOM_ANIMATION_MS + 40);
      },
      nextCenter ? ZOOM_FOCUS_PAN_MS : 0,
    );
  };

  return { adjustZoomLevel, isMapAnimating };
};

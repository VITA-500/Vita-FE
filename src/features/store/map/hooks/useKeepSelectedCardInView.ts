"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useElementResizeKey } from "@/shared/hooks/useElementResizeKey";
import type { KakaoMapWithCenter } from "@/shared/lib/kakaoMapTypes";
import {
  getCenterPlacingPointAt,
  getStoreCardTopInset,
  STORE_CARD_MARKER_GAP,
  type KakaoMapWithProjection,
} from "@/features/store/map/lib/mapFit";
import {
  STORE_CARD_SCROLL_AREA_ATTRIBUTE,
  STORE_CARD_SCROLL_MAX_HEIGHT_VAR,
} from "@/features/store/map/lib/storeCardScrollArea";
import type { StoreLocation } from "@/entities/store";

/** resizeKey는 크기가 멈춘 뒤에 바뀌므로, 렌더가 반영될 만큼만 잠깐 기다린다(ms). */
const CARD_SETTLE_DELAY_MS = 30;
/** 지도 크기 변화가 이 시간(ms) 동안 멈춘 뒤에 판단한다(창 크기를 줄이는 동안 매번 움직이지 않도록). */
const CONTAINER_RESIZE_SETTLE_MS = 120;
/** 지도를 밀어도 핀이 지도 아래쪽 가장자리에 붙지 않도록 남겨 둘 여백(px) */
const PIN_BOTTOM_PADDING = 12;
/** 카드 스크롤 영역 최대 높이의 상한(px). StorePanelInfoBubble의 min(480px, …)과 맞춘다. */
const MAX_CARD_SCROLL_HEIGHT = 480;
/** 지도 밀기(panTo)가 끝날 때까지 스크롤 영역 높이를 다시 계산하지 않는 시간(ms) */
const PAN_SETTLE_MS = 700;
/** 카드 스크롤 영역 최대 높이의 하한(px). 지도가 아주 작아도 경로 내용을 이만큼은 스크롤해 볼 수 있게 한다. */
const MIN_CARD_SCROLL_HEIGHT = 160;

type UseKeepSelectedCardInViewParams = {
  /** 카드가 보이는 상태인지(나타나기 전·길찾기 경로를 그리는 동안에는 판단하지 않는다) */
  isCardVisible: boolean;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  /** 카드 크기가 바뀔 때마다 바뀌는 key(useElementResizeKey) */
  resizeKey: number;
  selectedStore?: StoreLocation;
  selectedStoreCardRef: RefObject<HTMLDivElement | null>;
};

/**
 * 선택 매장 카드 위쪽이 지도 위 여백(검색창) 밖으로 나가지 않게 한다.
 * - 카드가 커졌거나(경로 상세 펼치기) 지도 크기가 바뀌었을 때(창 줄이기) 카드 위쪽이 넘치면,
 *   핀이 지도 아래 가장자리에 닿기 전까지 지도를 부드럽게 아래로 민다.
 * - 그래도 모자라면 카드 스크롤 영역 최대 높이를 "핀 위에 남는 공간"으로 줄여 카드 안에서 스크롤하게 한다(하한 있음).
 * - 사용자가 지도를 옮긴 경우에는 지도를 밀지 않는다.
 */
export const useKeepSelectedCardInView = ({
  isCardVisible,
  mapContainerRef,
  mapRef,
  resizeKey,
  selectedStore,
  selectedStoreCardRef,
}: UseKeepSelectedCardInViewParams) => {
  const containerResizeKey = useElementResizeKey(
    mapContainerRef,
    isCardVisible,
    CONTAINER_RESIZE_SETTLE_MS,
  );
  // 마지막으로 판단했을 때의 카드 높이와 지도 크기 key
  const settledRef = useRef<{
    containerResizeKey: number;
    height: number;
    storeId: string;
  } | null>(null);
  // 지도를 미는 동안(핀이 움직이는 중) 스크롤 영역 높이를 다시 계산하지 않을 시각
  const scrollMaxLockedUntilRef = useRef(0);

  useEffect(() => {
    if (!isCardVisible || !selectedStore) {
      settledRef.current = null;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const card = selectedStoreCardRef.current;
      const map = mapRef.current;
      const container = mapContainerRef.current;
      const kakaoMaps = window.kakao?.maps;

      if (!card || !map || !container || !kakaoMaps) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const topInset = getStoreCardTopInset(containerRect.width);
      const cardHeight = card.getBoundingClientRect().height;
      const previous = settledRef.current;
      const isSameStore = previous?.storeId === selectedStore.id;
      const hasGrown = isSameStore && cardHeight > previous.height;
      const hasContainerResized =
        isSameStore && containerResizeKey !== previous.containerResizeKey;

      settledRef.current = {
        containerResizeKey,
        height: cardHeight,
        storeId: selectedStore.id,
      };

      const pinPoint = (map as KakaoMapWithProjection)
        .getProjection?.()
        ?.containerPointFromCoords?.(
          new kakaoMaps.LatLng(selectedStore.lat, selectedStore.lng),
        );

      // 핀이 화면 밖이면 카드도 숨겨지므로 건드리지 않는다.
      if (
        !pinPoint ||
        pinPoint.x < 0 ||
        pinPoint.x > containerRect.width ||
        pinPoint.y < 0 ||
        pinPoint.y > containerRect.height
      ) {
        return;
      }

      const scrollArea = card.querySelector<HTMLElement>(
        `[${STORE_CARD_SCROLL_AREA_ATTRIBUTE}]`,
      );
      // 스크롤 영역 밖(헤더·여백) 높이와, 스크롤 없이 다 보여줄 때 필요한 카드 높이
      const fixedHeight = scrollArea
        ? cardHeight - scrollArea.getBoundingClientRect().height
        : cardHeight;
      const fullCardHeight = scrollArea
        ? fixedHeight +
          Math.min(scrollArea.scrollHeight, MAX_CARD_SCROLL_HEIGHT)
        : cardHeight;
      // 카드 전체가 위 여백 아래에 들어가려면 핀이 있어야 할 높이
      const neededPinY = topInset + fullCardHeight + STORE_CARD_MARKER_GAP;
      const maxPinY = containerRect.height - PIN_BOTTOM_PADDING;
      // 카드가 커졌거나 지도 크기가 바뀌었을 때만 지도를 민다(사용자가 옮긴 지도는 그대로 둔다).
      const targetPinY =
        (hasGrown || hasContainerResized) && neededPinY > pinPoint.y
          ? Math.max(pinPoint.y, Math.min(maxPinY, neededPinY))
          : pinPoint.y;
      const isPanning = targetPinY > pinPoint.y;

      // 스크롤 영역 최대 높이 = 핀(이동 후 위치) 위에 남는 공간. 넘치는 내용은 카드 안에서 스크롤한다.
      // 지도를 미는 중에는 핀 위치가 바뀌는 중이라, 밀기 시작할 때 정한 값을 잠시 유지한다.
      if (
        scrollArea &&
        (isPanning || Date.now() >= scrollMaxLockedUntilRef.current)
      ) {
        const maxScrollHeight = Math.max(
          MIN_CARD_SCROLL_HEIGHT,
          targetPinY - STORE_CARD_MARKER_GAP - topInset - fixedHeight,
        );

        card.style.setProperty(
          STORE_CARD_SCROLL_MAX_HEIGHT_VAR,
          `${Math.floor(maxScrollHeight)}px`,
        );
      }

      if (!isPanning) {
        return;
      }

      const nextCenter = getCenterPlacingPointAt(
        map,
        selectedStore,
        { x: pinPoint.x, y: targetPinY },
        { height: containerRect.height, width: containerRect.width },
      );

      if (!nextCenter) {
        return;
      }

      scrollMaxLockedUntilRef.current = Date.now() + PAN_SETTLE_MS;

      // 위아래로만 민다. 경도는 현재 중심을 그대로 써서 지도가 좌우로 흔들리지 않게 한다.
      const currentCenter = (map as KakaoMapWithCenter).getCenter();

      map.panTo?.(
        new kakaoMaps.LatLng(nextCenter.getLat(), currentCenter.getLng()),
      );
    }, CARD_SETTLE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    containerResizeKey,
    isCardVisible,
    mapContainerRef,
    mapRef,
    resizeKey,
    selectedStore,
    selectedStoreCardRef,
  ]);
};

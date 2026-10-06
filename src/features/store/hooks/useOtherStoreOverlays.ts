"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { MapOverlayHandle } from "@/features/store/lib/kakaoMapTypes";
import { createOtherStoreOverlay } from "@/features/store/lib/mapOverlayElements";
import type { StoreLocation } from "@/features/store/types";

type UseOtherStoreOverlaysParams = {
  isKakaoMapReady: boolean;
  /** 핀 클릭 시각(핀 클릭이 지도 click으로 이어져 카드가 바로 닫히는 것을 막는 데 사용) */
  lastMarkerClickAtRef: RefObject<number>;
  mapRef: RefObject<KakaoMap | null>;
  onSelectStoreRef: RefObject<(storeId: string) => void>;
  otherStores: StoreLocation[];
  otherStoresRef: RefObject<StoreLocation[]>;
  setRevealedCardStoreId: Dispatch<SetStateAction<string>>;
};

/** 핀(현재 페이지) 외 나머지 매장을 반투명 원 오버레이로 그린다. */
export const useOtherStoreOverlays = ({
  isKakaoMapReady,
  lastMarkerClickAtRef,
  mapRef,
  onSelectStoreRef,
  otherStores,
  otherStoresRef,
  setRevealedCardStoreId,
}: UseOtherStoreOverlaysParams) => {
  // 나머지 매장(반투명 원) 오버레이. 핀 오버레이와 따로 관리해 핀을 다시 그리지 않고 켜고 끌 수 있게 한다.
  const otherStoreOverlayRefs = useRef<MapOverlayHandle[]>([]);
  // 배열이 렌더마다 새로 만들어져도 구성(매장·좌표)이 같으면 원을 다시 그리지 않도록 key로 비교한다.
  const otherStoresKey = otherStores
    .map((store) => `${store.id}:${store.lat}:${store.lng}`)
    .join(",");

  /** 핀(현재 페이지) 외 나머지 매장을 반투명 원으로 그린다. 페이지를 옮기면 그 페이지 매장은 핀으로 바뀐다. */
  useEffect(() => {
    const map = mapRef.current;

    if (!isKakaoMapReady || !map || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;

    otherStoreOverlayRefs.current = otherStoresRef.current.map((store) =>
      createOtherStoreOverlay({
        kakaoMaps,
        map,
        store,
        onSelect: (event) => {
          event.stopPropagation();
          lastMarkerClickAtRef.current = Date.now();
          setRevealedCardStoreId("");
          onSelectStoreRef.current(store.id);
        },
      }),
    );

    return () => {
      otherStoreOverlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      otherStoreOverlayRefs.current = [];
    };
    // ref·setter는 항상 같은 값이라 의존성에 넣어도 기존과 같은 시점에만 다시 실행된다.
  }, [
    isKakaoMapReady,
    lastMarkerClickAtRef,
    mapRef,
    onSelectStoreRef,
    otherStoresKey,
    otherStoresRef,
    setRevealedCardStoreId,
  ]);
};

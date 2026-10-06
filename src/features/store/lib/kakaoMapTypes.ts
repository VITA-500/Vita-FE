/** 지도 미리보기(StoreMapPreview)와 오버레이 helper가 함께 쓰는 카카오맵 관련 타입 */
import type { StoreLocation } from "@/features/store/types";

export type KakaoMapEventApi = {
  addListener: (
    target: KakaoMap,
    eventName:
      | "dragend"
      | "zoom_changed"
      | "idle"
      | "center_changed"
      | "click"
      | "tilesloaded",
    callback: () => void,
  ) => void;
  removeListener: (
    target: KakaoMap,
    eventName:
      | "dragend"
      | "zoom_changed"
      | "idle"
      | "center_changed"
      | "click"
      | "tilesloaded",
    callback: () => void,
  ) => void;
};

export type KakaoMapWithCenter = KakaoMap & {
  getCenter: () => {
    getLat: () => number;
    getLng: () => number;
  };
};

export type MapOverlayHandle = {
  marker?: KakaoMarker;
  overlay: KakaoCustomOverlay;
  cleanup?: () => void;
};

export type StoreMarkerGroupEntry = {
  index: number;
  store: StoreLocation;
};

export type KakaoMapsApi = NonNullable<NonNullable<Window["kakao"]>["maps"]>;

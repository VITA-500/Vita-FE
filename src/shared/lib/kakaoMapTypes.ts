/** 카카오맵 지도·이벤트·오버레이 공통 타입. 도메인(매장 등)을 모르는 타입만 둔다. */

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

export type KakaoMapsApi = NonNullable<NonNullable<Window["kakao"]>["maps"]>;

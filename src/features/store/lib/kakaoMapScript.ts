import { env } from "@/shared/config/env";

declare global {
  interface Window {
    kakao?: {
      maps?: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (
          container: HTMLElement,
          options: { center: KakaoLatLng; level: number },
        ) => KakaoMap;
        Marker: new (options: {
          map: KakaoMap | null;
          position: KakaoLatLng;
          title?: string;
        }) => KakaoMarker;
        CustomOverlay: new (options: {
          content: HTMLElement;
          map: KakaoMap | null;
          position: KakaoLatLng;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
        }) => KakaoCustomOverlay;
        event: {
          addListener: (
            target: KakaoMarker,
            eventName: string,
            callback: () => void,
          ) => void;
        };
      };
    };
  }

  interface KakaoLatLng {
    readonly __kakaoLatLngBrand?: never;
  }

  interface KakaoMap {
    setCenter: (latLng: KakaoLatLng) => void;
    setLevel: (level: number) => void;
  }

  interface KakaoMarker {
    setMap: (map: KakaoMap | null) => void;
  }

  interface KakaoCustomOverlay {
    setMap: (map: KakaoMap | null) => void;
  }
}

const KAKAO_MAP_SCRIPT_ID = "kakao-map-sdk";

export const loadKakaoMapScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.kakao?.maps) {
    return Promise.resolve(true);
  }

  if (!env.kakaoMapAppKey) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao?.maps?.load(() => resolve(true));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Kakao map SDK"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${env.kakaoMapAppKey}&autoload=false`;
    script.onload = () => {
      window.kakao?.maps?.load(() => resolve(true));
    };
    script.onerror = () => reject(new Error("Failed to load Kakao map SDK"));
    document.head.appendChild(script);
  });
};

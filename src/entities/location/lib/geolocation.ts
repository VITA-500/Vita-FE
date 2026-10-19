import type { LatLng } from "@/shared/lib/geo";

/** 브라우저 위치 조회를 Promise로 감싼다. 위치 기능이 없으면 GEOLOCATION_UNSUPPORTED로 실패한다. */
export const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

export const toLatLng = (position: GeolocationPosition): LatLng => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
});

/** 브라우저의 위치 권한 상태. 권한 API를 지원하지 않으면 null. */
export const getGeolocationPermissionState =
  async (): Promise<PermissionState | null> => {
    try {
      const status = await navigator.permissions?.query({
        name: "geolocation",
      });

      return status?.state ?? null;
    } catch {
      return null;
    }
  };

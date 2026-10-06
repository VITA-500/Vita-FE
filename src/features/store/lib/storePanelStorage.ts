/** 위치 허용 모달에서 "위치 허용"을 누른 적이 있는지(권한 API가 없는 브라우저용 보조 기록). */
export const LOCATION_CONSENT_STORAGE_KEY = "vita-store-location-consent";
/** 이번 세션에서 위치 허용 모달을 "나중에"로 닫았는지. */
export const LOCATION_MODAL_DISMISSED_STORAGE_KEY =
  "vita-store-location-modal-dismissed";

export const readStorage = (storage: "local" | "session", key: string) => {
  try {
    return (
      storage === "local" ? window.localStorage : window.sessionStorage
    ).getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (
  storage: "local" | "session",
  key: string,
  value: string,
) => {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(
      key,
      value,
    );
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 기록 없이 진행한다.
  }
};

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

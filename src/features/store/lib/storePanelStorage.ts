/** 위치 허용 모달에서 "위치 허용"을 누른 적이 있는지(권한 API가 없는 브라우저용 보조 기록). */
export const LOCATION_CONSENT_STORAGE_KEY = "vita-store-location-consent";
/** 이번 세션에서 위치 허용 모달을 "나중에"로 닫았는지. */
export const LOCATION_MODAL_DISMISSED_STORAGE_KEY =
  "vita-store-location-modal-dismissed";

// 위치 권한 조회는 entities/location으로 옮겼다. 기존 import 경로 호환용 재내보내기.
export { getGeolocationPermissionState } from "@/entities/location";

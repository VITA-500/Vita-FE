// 위치 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
// 좌표 타입과 거리 계산은 도메인과 무관해서 @/shared/lib/geo에 둔다.
export {
  getCurrentPosition,
  getGeolocationPermissionState,
  toLatLng,
} from "@/entities/location/lib/geolocation";
export {
  useUserLocation,
  type UserLocationStatus,
} from "@/entities/location/model/useUserLocation";

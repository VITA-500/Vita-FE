// 리팩토링 기간 임시 경로입니다. 새 경로: 좌표·거리 계산은 @/shared/lib/geo, 매장 검색은 @/entities/store
// docs/Architecture.md Migration 7단계에서 삭제합니다.
export {
  formatDistance,
  formatDurationSeconds,
  formatRemainingDistance,
  formatWalkingTime,
  getDistanceMeters,
  type LatLng,
  type UserLocation,
} from "@/shared/lib/geo";
export { matchesStoreSearch } from "@/entities/store";

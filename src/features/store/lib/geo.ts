import type { StoreLocation } from "@/features/store/types";

export type UserLocation = {
  lat: number;
  lng: number;
};

const toRadians = (degree: number) => (degree * Math.PI) / 180;

export const getDistanceMeters = (
  from: UserLocation,
  to: Pick<StoreLocation, "lat" | "lng">,
) => {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `약 ${Math.round(meters / 10) * 10}m`;
  }

  return `약 ${(meters / 1000).toFixed(1)}km`;
};

export const formatRemainingDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.max(0, Math.round(meters / 10) * 10)}m`;
  }

  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatWalkingTime = (meters: number) => {
  const walkingMetersPerMinute = 67;
  const minutes = Math.max(1, Math.ceil(meters / walkingMetersPerMinute));

  if (minutes < 60) {
    return `약 ${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `약 ${hours}시간`
    : `약 ${hours}시간 ${remainingMinutes}분`;
};

export const formatDurationSeconds = (seconds: number) => {
  const minutes = Math.max(1, Math.ceil(seconds / 60));

  if (minutes < 60) {
    return `약 ${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `약 ${hours}시간`
    : `약 ${hours}시간 ${remainingMinutes}분`;
};

const normalizeSearchText = (value: string) =>
  value.replace(/\s/g, "").toLowerCase();

/**
 * 매장 검색 매칭 기준: 매장명 / 주소(도로명·지번) / 전화번호를 **각각** 비교한다.
 * - 필드를 이어 붙여 비교하면 "매장명 끝 + 주소 앞"처럼 경계를 넘는 오탐이 생겨 분리했다.
 * - 전화번호는 하이픈·공백을 무시하고 숫자끼리 비교한다.
 * - 주변/전국 조회 응답에는 주소·전화번호가 없어서, 상세 조회 전 매장은 사실상 매장명으로만 검색된다.
 */
export const matchesStoreSearch = (store: StoreLocation, query: string) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (
    normalizeSearchText(store.name).includes(normalizedQuery) ||
    normalizeSearchText(store.address ?? "").includes(normalizedQuery)
  ) {
    return true;
  }

  const queryDigits = normalizedQuery.replace(/\D/g, "");
  const phoneDigits = (store.phone ?? "").replace(/\D/g, "");

  return (
    queryDigits.length >= 3 &&
    queryDigits.length === normalizedQuery.replace(/-/g, "").length &&
    phoneDigits.includes(queryDigits)
  );
};

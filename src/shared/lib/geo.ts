/** 위도·경도 좌표. 사용자 위치, 매장 좌표, 경로 지점에 함께 쓴다. */
export type LatLng = {
  lat: number;
  lng: number;
};

/** 사용자 현재 위치(기존 이름 유지) */
export type UserLocation = LatLng;

const toRadians = (degree: number) => (degree * Math.PI) / 180;

export const getDistanceMeters = (from: UserLocation, to: LatLng) => {
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

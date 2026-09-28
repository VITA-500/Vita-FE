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

export const matchesStoreSearch = (store: StoreLocation, query: string) => {
  const normalizedQuery = query.replace(/\s/g, "").toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return `${store.name}${store.address}${store.phone}`
    .replace(/\s/g, "")
    .toLowerCase()
    .includes(normalizedQuery);
};

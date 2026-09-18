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

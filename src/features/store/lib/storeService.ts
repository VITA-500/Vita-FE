import { mockStores } from "@/features/store/constants";
import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreLocation, StoreRoute } from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type StoreNearbyItemResponse = {
  storeId: number;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  consultServices?: string[];
  providedServices?: string[];
};

type NearbyStoresResponse = {
  stores: StoreNearbyItemResponse[];
};

type RouteResponse = {
  distanceMeters: number;
  durationSeconds: number;
  mode: string;
  path: { lat: number; lng: number }[];
};

const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

const toNearbyStoreLocation = (
  store: StoreNearbyItemResponse,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  address: "상세 주소 확인 중",
  consultServices: store.consultServices,
  phone: "",
  providedServices: store.providedServices,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: formatDistance(store.distanceKm * 1000),
});

export const storeService = {
  getNearbyStores: () => mockStores,
  fetchNearbyStores: async (location?: UserLocation) => {
    if (!location) {
      return mockStores;
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: "5",
    });

    const response = await requestJson<NearbyStoresResponse>(
      `/stores/nearby?${params.toString()}`,
      {
        timeoutMs: 12000,
      },
    );

    const stores = response.stores.slice(0, 20).map(toNearbyStoreLocation);

    return stores.length > 0 ? stores : mockStores;
  },
  fetchWalkingRoute: async (
    storeId: string,
    location: UserLocation,
  ): Promise<StoreRoute> => {
    if (!isApiStoreId(storeId)) {
      throw new Error("NON_API_STORE_ID");
    }

    const params = new URLSearchParams({
      fromLat: String(location.lat),
      fromLng: String(location.lng),
      mode: "walk",
    });

    const response = await requestJson<RouteResponse>(
      `/stores/${storeId}/directions?${params.toString()}`,
      {
        timeoutMs: 7000,
      },
    );

    return {
      distanceMeters: response.distanceMeters,
      durationSeconds: response.durationSeconds,
      mode: "walk",
      path: response.path.map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
      })),
    };
  },
};

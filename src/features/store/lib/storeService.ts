import { mockStores } from "@/features/store/constants";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type NearbyStoresResponse = {
  stores: StoreLocation[];
};

export const storeService = {
  getNearbyStores: () => mockStores,
  fetchNearbyStores: async (location?: UserLocation) => {
    const query = location
      ? `?lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}`
      : "";

    return requestJson<NearbyStoresResponse>(`/api/stores/nearby${query}`);
  },
};

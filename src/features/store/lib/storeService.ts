import { mockStores } from "@/features/store/constants";
import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type StoreDetailResponse = {
  storeId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  businessHours: string;
  phone: string;
};

type StoreNearbyItemResponse = {
  storeId: number;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

type NearbyStoresResponse = {
  stores: StoreNearbyItemResponse[];
};

const toStoreLocation = (
  store: StoreDetailResponse,
  distanceKm?: number,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  address: store.address,
  phone: store.phone,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText:
    typeof distanceKm === "number"
      ? formatDistance(distanceKm * 1000)
      : undefined,
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
        timeoutMs: 5000,
      },
    );

    const stores = await Promise.all(
      response.stores.slice(0, 12).map(async (store) => {
        const detail = await requestJson<StoreDetailResponse>(
          `/stores/${store.storeId}`,
          {
            timeoutMs: 5000,
          },
        );

        return toStoreLocation(detail, store.distanceKm);
      }),
    );

    return stores.length > 0 ? stores : mockStores;
  },
};

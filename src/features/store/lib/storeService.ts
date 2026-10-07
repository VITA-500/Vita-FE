import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import {
  getRoutePath,
  getRouteSegments,
  type RouteResponse,
} from "@/features/store/lib/storeRouteResponse";
import type {
  StoreLocation,
  StoreRoute,
  StoreRouteMode,
} from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type StoreNearbyItemResponse = {
  storeId: number;
  name: string;
  /** 2026-10-06 BE 반영. 예전 응답에는 없을 수 있다. */
  address?: string | null;
  phone?: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  /** 2026-10-07 BE 반영(통신·제휴 모두). 예전 응답에는 없을 수 있다. */
  businessHours?: string | null;
  consultServices?: string[];
  providedServices?: string[];
};

type NearbyStoresResponse = {
  stores: StoreNearbyItemResponse[];
};

type StoreDetailResponse = {
  storeId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  businessHours?: string;
  phone?: string;
  consultServices?: string[];
  providedServices?: string[];
};

const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

const toNearbyStoreLocation = (
  store: StoreNearbyItemResponse,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  // 주소가 없으면(예전 응답) 빈 값으로 두고 UI에서 안내 문구를 보여준다.
  address: store.address ?? "",
  businessHours: store.businessHours ?? undefined,
  consultServices: store.consultServices,
  phone: store.phone ?? "",
  providedServices: store.providedServices,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: formatDistance(store.distanceKm * 1000),
  storeType: "PHONE",
});

const toStoreLocation = (
  store: StoreDetailResponse,
  fallback?: StoreLocation,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  // 상세에 값이 비어 있으면 주변 조회에서 받은 값을 유지한다.
  address: store.address || fallback?.address || "",
  businessHours: store.businessHours || fallback?.businessHours,
  benefitBrand: fallback?.benefitBrand,
  benefitCategory: fallback?.benefitCategory,
  benefitId: fallback?.benefitId,
  benefitName: fallback?.benefitName,
  consultServices: store.consultServices ?? fallback?.consultServices,
  phone: store.phone || fallback?.phone || "",
  providedServices: store.providedServices ?? fallback?.providedServices,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: fallback?.distanceText,
  storeType: fallback?.storeType ?? "PHONE",
});

export const storeService = {
  /** 기준 좌표에서 반경(km, 기본 1.5km) 안의 매장을 가까운 순으로 모두 가져온다. */
  fetchNearbyStores: async (location?: UserLocation, radiusKm = 1.5) => {
    if (!location) {
      return [];
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radiusKm),
    });

    const response = await requestJson<NearbyStoresResponse>(
      `/stores/nearby?${params.toString()}`,
      {
        timeoutMs: 12000,
      },
    );

    // 개수 제한 없이 반경 내 매장을 모두 받고, 화면에서 12개씩 페이지로 나눠 보여준다.
    const stores = response.stores.map(toNearbyStoreLocation);

    return stores;
  },
  fetchStoreDetail: async (storeId: string, fallback?: StoreLocation) => {
    if (!isApiStoreId(storeId)) {
      return fallback ?? null;
    }

    const response = await requestJson<StoreDetailResponse>(
      `/stores/${storeId}`,
      {
        timeoutMs: 7000,
      },
    );

    return toStoreLocation(response, fallback);
  },
  fetchRoute: async (
    storeId: string,
    location: UserLocation,
    mode: StoreRouteMode,
  ): Promise<StoreRoute> => {
    if (!isApiStoreId(storeId)) {
      throw new Error("NON_API_STORE_ID");
    }

    const params = new URLSearchParams({
      fromLat: String(location.lat),
      fromLng: String(location.lng),
      mode,
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
      mode: response.mode,
      path: getRoutePath(response),
      segments: getRouteSegments(response),
    };
  },
};

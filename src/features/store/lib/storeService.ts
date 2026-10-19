import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import {
  getRoutePath,
  getRouteSegments,
  type RouteResponse,
} from "@/features/store/lib/storeRouteResponse";
import { toOpenFilterParams } from "@/features/store/lib/storeOpenHours";
import type {
  StoreLocation,
  StoreOpenFilter,
  StoreRoute,
  StoreRouteMode,
} from "@/features/store/types";
import { reservationApi } from "@/entities/reservation";
import { requestJson } from "@/shared/api/http";

type StoreNearbyItemResponse = {
  storeId: number;
  name: string;
  storeType?: StoreLocation["storeType"] | null;
  /** 2026-10-06 BE 반영. 예전 응답에는 없을 수 있다. */
  address?: string | null;
  phone?: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  /** 2026-10-07 BE 반영(통신·제휴 모두). 예전 응답에는 없을 수 있다. */
  businessHours?: string | null;
  openNow?: boolean | null;
  consultServices?: string[];
  providedServices?: string[];
  benefitId?: number | null;
  brand?: string | null;
  category?: string | null;
  benefitName?: string | null;
  benefitDescription?: string | null;
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
  openNow?: boolean;
  phone?: string;
  consultServices?: string[];
  providedServices?: string[];
  storeType?: StoreLocation["storeType"] | null;
  /** 제휴 매장이면 연결된 혜택. 상세에는 benefitDescription이 없어 주변 조회 값을 유지한다. */
  benefitId?: number | null;
  brand?: string | null;
  category?: string | null;
  benefitName?: string | null;
};

export type { ReservationResponse } from "@/entities/reservation";

const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

const toNearbyStoreLocation = (
  store: StoreNearbyItemResponse,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  // 주소가 없으면(예전 응답) 빈 값으로 두고 UI에서 안내 문구를 보여준다.
  address: store.address ?? "",
  businessHours: store.businessHours ?? undefined,
  benefitBrand: store.brand ?? undefined,
  benefitCategory: store.category ?? undefined,
  benefitDescription: store.benefitDescription ?? undefined,
  benefitId: store.benefitId ?? undefined,
  benefitName: store.benefitName ?? undefined,
  consultServices: store.consultServices,
  phone: store.phone ?? "",
  providedServices: store.providedServices,
  openNow: store.openNow ?? undefined,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: formatDistance(store.distanceKm * 1000),
  storeType: store.storeType ?? "PHONE",
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
  benefitBrand: store.brand ?? fallback?.benefitBrand,
  benefitCategory: store.category ?? fallback?.benefitCategory,
  benefitDescription: fallback?.benefitDescription,
  benefitId: store.benefitId ?? fallback?.benefitId,
  benefitName: store.benefitName ?? fallback?.benefitName,
  consultServices: store.consultServices ?? fallback?.consultServices,
  phone: store.phone || fallback?.phone || "",
  providedServices: store.providedServices ?? fallback?.providedServices,
  openNow: store.openNow ?? fallback?.openNow,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: fallback?.distanceText,
  storeType: store.storeType ?? fallback?.storeType ?? "PHONE",
});

type FetchNearbyStoresOptions = {
  /** 영업 시간 필터(BE openNow / openAt). 없으면 조건 없이 조회한다. */
  openFilter?: StoreOpenFilter;
};

export const storeService = {
  /** 기준 좌표에서 반경(km, 기본 1.5km) 안의 매장을 가까운 순으로 모두 가져온다. storeType은 BE 값을 쓴다. */
  fetchNearbyStores: async (
    location?: UserLocation,
    radiusKm = 1.5,
    options: FetchNearbyStoresOptions = {},
  ) => {
    if (!location) {
      return [];
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radiusKm),
      ...toOpenFilterParams(options.openFilter),
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
  /** 매장 예약. entities/reservation으로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  reserveStore: reservationApi.createReservation,
};

import { toOpenFilterParams } from "@/entities/store/model/storeOpenHours";
import type {
  StoreLocation,
  StoreOpenFilter,
} from "@/entities/store/model/types";
import { requestJson } from "@/shared/api/http";
import { formatDistance, type UserLocation } from "@/shared/lib/geo";
import { demoStores } from "@/entities/store/model/demoStores";

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

export type StoreDetailResponse = {
  storeId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  businessHours?: string | null;
  openNow?: boolean | null;
  phone?: string | null;
  consultServices?: string[];
  providedServices?: string[];
  storeType?: StoreLocation["storeType"] | null;
  /** 제휴 매장이면 연결된 혜택. 상세에는 benefitDescription이 없어 주변 조회 값을 유지한다. */
  benefitId?: number | null;
  brand?: string | null;
  category?: string | null;
  benefitName?: string | null;
};

/** 지도 목업 매장처럼 숫자가 아닌 id는 API 매장이 아니다. */
export const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

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

/**
 * 상세 응답을 화면 모델로 바꾼다. 상세에 비어 있는 칸은 목록(주변 조회 등)에서 받은 값으로 채운다.
 * 상세 응답만 캐시하고 목록 값은 쓸 때마다 이 함수로 합친다(거리처럼 목록마다 다른 값이 캐시에 섞이지 않도록).
 */
export const mergeStoreDetail = (
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

type BenefitStoreItemResponse = {
  storeId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  businessHours?: string | null;
  openNow?: boolean | null;
  benefitId: number;
  brand: string;
  category: string;
  benefitName: string;
  benefitDescription?: string | null;
};

type BenefitStoresResponse = {
  category: string;
  stores: BenefitStoreItemResponse[];
};

const toBenefitStoreLocation = (
  store: BenefitStoreItemResponse,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  address: store.address,
  benefitBrand: store.brand,
  benefitCategory: store.category,
  benefitDescription: store.benefitDescription ?? undefined,
  benefitId: store.benefitId,
  benefitName: store.benefitName,
  businessHours: store.businessHours ?? undefined,
  consultServices: [],
  openNow: store.openNow ?? undefined,
  phone: "",
  providedServices: [store.benefitName],
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: formatDistance(store.distanceKm * 1000),
  storeType: "PARTNER",
});

type FetchNearbyStoresOptions = {
  /** 영업 시간 필터(BE openNow / openAt). 없으면 조건 없이 조회한다. */
  openFilter?: StoreOpenFilter;
};

/** 매장 API (/stores, /benefits/{category}/stores). 매장 지도·채팅이 함께 쓴다. */
export const storeApi = {
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

    let response: NearbyStoresResponse;
    try {
      response = await requestJson<NearbyStoresResponse>(
        `/stores/nearby?${params.toString()}`,
        { timeoutMs: 12000 },
      );
    } catch {
      return demoStores.filter((store) => store.storeType === "PHONE");
    }

    // 개수 제한 없이 반경 내 매장을 모두 받고, 화면에서 12개씩 페이지로 나눠 보여준다.
    const stores = response.stores.map(toNearbyStoreLocation);

    return stores;
  },
  /** 상세 응답 그대로(목록 값과 합치기 전). 캐시용. API 매장 id가 아니면 null */
  fetchStoreDetailResponse: async (storeId: string) =>
    isApiStoreId(storeId)
      ? requestJson<StoreDetailResponse>(`/stores/${storeId}`, {
          timeoutMs: 7000,
        })
      : null,
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

    return mergeStoreDetail(response, fallback);
  },
  /** 혜택 카테고리별 주변 제휴 매장. 응답이 매장 모델이라 store entity에 둔다. */
  fetchBenefitStores: async (
    category: string,
    location?: UserLocation,
    radiusKm = 1.5,
    limit = 100,
    options: FetchNearbyStoresOptions = {},
  ) => {
    if (!location || !category) {
      return [];
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radiusKm),
      limit: String(limit),
      ...toOpenFilterParams(options.openFilter),
    });

    let response: BenefitStoresResponse;
    try {
      response = await requestJson<BenefitStoresResponse>(
        `/benefits/${encodeURIComponent(category)}/stores?${params.toString()}`,
        { timeoutMs: 12000 },
      );
    } catch {
      return demoStores.filter(
        (store) =>
          store.storeType === "PARTNER" && store.benefitCategory === category,
      );
    }

    return response.stores.map(toBenefitStoreLocation);
  },
};

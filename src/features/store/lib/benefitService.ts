import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import { toOpenFilterParams } from "@/features/store/lib/storeOpenHours";
import type { StoreLocation, StoreOpenFilter } from "@/features/store/types";
import { benefitApi, type BenefitCategoryOption } from "@/entities/benefit";
import { requestJson } from "@/shared/api/http";

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

export type { BenefitCategoryOption };

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

/**
 * 매장 지도의 제휴 혜택 조회: 혜택 카테고리 목록, 카테고리별 주변 제휴 매장.
 * 혜택 목록은 entities/benefit을 쓴다. 제휴 매장 조회는 결과가 매장 모델이라 store entity를 만들 때 옮긴다.
 */
export const benefitService = {
  /** 혜택 카테고리 선택지. entities/benefit으로 옮겼고 기존 호출부 호환을 위해 그대로 둔다. */
  fetchBenefitCategories: benefitApi.fetchBenefitCategories,
  fetchBenefitStores: async (
    category: string,
    location?: UserLocation,
    radiusKm = 1.5,
    limit = 100,
    options: { openFilter?: StoreOpenFilter } = {},
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

    const response = await requestJson<BenefitStoresResponse>(
      `/benefits/${encodeURIComponent(category)}/stores?${params.toString()}`,
      {
        timeoutMs: 12000,
      },
    );

    return response.stores.map(toBenefitStoreLocation);
  },
};

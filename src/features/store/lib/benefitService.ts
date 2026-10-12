import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import { toOpenFilterParams } from "@/features/store/lib/storeOpenHours";
import type { StoreLocation, StoreOpenFilter } from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type BenefitResponse = {
  benefitId: number;
  brand: string;
  name: string;
  category: string;
  description: string;
  storeCount: number;
};

type BenefitListResponse = {
  benefits: BenefitResponse[];
};

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

export type BenefitCategoryOption = {
  label: string;
  value: string;
  storeCount: number;
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

const toBenefitCategoryOptions = (benefits: BenefitResponse[]) => {
  const categoryMap = new Map<string, number>();

  benefits.forEach((benefit) => {
    categoryMap.set(
      benefit.category,
      (categoryMap.get(benefit.category) ?? 0) + benefit.storeCount,
    );
  });

  return Array.from(categoryMap.entries()).map(([category, storeCount]) => ({
    label: category,
    value: category,
    storeCount,
  }));
};

/** 제휴 혜택 API: 혜택 카테고리 목록, 카테고리별 주변 제휴 매장 */
export const benefitService = {
  fetchBenefitCategories: async () => {
    const response = await requestJson<BenefitListResponse>("/benefits/list", {
      timeoutMs: 7000,
    });

    return toBenefitCategoryOptions(response.benefits);
  },
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

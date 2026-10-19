import type {
  AdminStore,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { benefitApi } from "@/entities/benefit";
import { requestJson } from "@/shared/api/http";

type AdminStoreRequest = Omit<
  AdminStoreDetail,
  | "brand"
  | "category"
  | "benefitName"
  | "createdAt"
  | "storeId"
  | "storeType"
  | "updatedAt"
>;
type AdminStoreCreateRequest = AdminStoreRequest & {
  storeType: AdminStoreType;
};

type StoreListResponse = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  content: StoreListItemResponse[];
};

type StoreListItemResponse = Omit<AdminStore, "storeType"> &
  Partial<Pick<AdminStore, "storeType">>;
type StoreDetailResponse = Omit<AdminStoreDetail, "storeType"> &
  Partial<Pick<AdminStoreDetail, "storeType">>;
type StoreUpdateResponse = Pick<AdminStore, "storeId" | "updatedAt">;
export const adminStoreService = {
  /** 매장 수만 필요할 때. 상세 조회 없이 목록 totalCount만 쓴다. */
  countStores: async (storeType?: AdminStoreType) => {
    const response = await fetchStoreListPage({
      page: 0,
      size: 1,
      sortBy: "createdAt,desc",
      storeType,
    });

    return response.totalCount;
  },

  fetchStores: async ({
    keyword,
    page,
    size,
    sortBy,
    storeType,
    category,
    benefitId,
  }: {
    keyword?: string;
    page: number;
    size: number;
    sortBy: string;
    storeType?: AdminStoreType;
    category?: string;
    benefitId?: number;
  }) => {
    const response = await fetchStoreListPage({
      keyword,
      page,
      size,
      sortBy,
      storeType,
      category,
      benefitId,
    });
    const stores = response.content.map((store) => ({
      ...store,
      storeType: store.storeType ?? storeType ?? ("PHONE" as const),
    }));

    const details = await Promise.all(
      stores.map(async (store): Promise<AdminStoreDetail> => {
        const detail = await requestJson<StoreDetailResponse>(
          `/stores/${store.storeId}`,
          {
            timeoutMs: 8000,
          },
        );

        return {
          ...detail,
          lat: Number(detail.lat),
          lng: Number(detail.lng),
          consultServices: detail.consultServices ?? [],
          providedServices: detail.providedServices ?? [],
          storeType: detail.storeType ?? store.storeType,
        };
      }),
    );

    return {
      currentPage: response.currentPage,
      stores,
      details,
      totalCount: response.totalCount,
      totalPages: response.totalPages,
    };
  },

  createStore: async (input: AdminStoreCreateRequest) => {
    await requestJson("/admin/stores", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    });
  },

  updateStore: async (storeId: number, input: AdminStoreRequest) => {
    return requestJson<StoreUpdateResponse>(`/admin/stores/${storeId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    });
  },

  deleteStore: async (storeId: number) => {
    await requestJson(`/admin/stores/${storeId}`, {
      method: "DELETE",
      timeoutMs: 8000,
    });
  },

  /** 매장 폼의 혜택 선택지. /benefits/list 조회는 entities/benefit 하나로 모았다. */
  fetchBenefits: (category?: string) => benefitApi.fetchBenefits({ category }),
};

const fetchStoreListPage = async ({
  keyword,
  page,
  size,
  sortBy,
  storeType,
  category,
  benefitId,
}: {
  keyword?: string;
  page: number;
  size: number;
  sortBy: string;
  storeType?: AdminStoreType;
  category?: string;
  benefitId?: number;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
  });

  if (keyword?.trim()) {
    params.set("keyword", keyword.trim());
  }

  if (storeType) {
    params.set("storeType", storeType);
  }

  if (storeType === "PARTNER" && category !== undefined) {
    params.set("category", String(category));
  }

  if (storeType === "PARTNER" && benefitId !== undefined) {
    params.set("benefitId", String(benefitId));
  }

  return requestJson<StoreListResponse>(`/admin/stores?${params.toString()}`, {
    timeoutMs: 8000,
  });
};

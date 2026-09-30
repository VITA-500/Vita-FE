import type { AdminStore, AdminStoreDetail } from "@/features/admin/types";
import { requestJson } from "@/shared/api/http";

type AdminStoreRequest = Omit<
  AdminStoreDetail,
  "createdAt" | "storeId" | "updatedAt"
>;

type StoreListResponse = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  content: AdminStore[];
};

type StoreDetailResponse = AdminStoreDetail;

export const adminStoreService = {
  fetchStores: async ({
    keyword,
    page,
    size,
    sortBy,
  }: {
    keyword?: string;
    page: number;
    size: number;
    sortBy: string;
  }) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortBy,
    });

    if (keyword?.trim()) {
      params.set("keyword", keyword.trim());
    }

    const response = await requestJson<StoreListResponse>(
      `/admin/stores?${params.toString()}`,
      { timeoutMs: 8000 },
    );

    const stores = response.content;
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

  createStore: async (input: AdminStoreRequest) => {
    await requestJson("/admin/stores", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    });
  },

  updateStore: async (storeId: number, input: AdminStoreRequest) => {
    await requestJson(`/admin/stores/${storeId}`, {
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
};

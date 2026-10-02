import type {
  AdminStore,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { requestJson } from "@/shared/api/http";

type AdminStoreRequest = Omit<
  AdminStoreDetail,
  "createdAt" | "storeId" | "storeType" | "updatedAt"
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
  fetchStores: async ({
    keyword,
    page,
    size,
    sortBy,
    storeType,
  }: {
    keyword?: string;
    page: number;
    size: number;
    sortBy: string;
    storeType?: AdminStoreType;
  }) => {
    const response = await fetchStoreListPage({
      keyword,
      page,
      size,
      sortBy,
      storeType,
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
};

const fetchStoreListPage = async ({
  keyword,
  page,
  size,
  sortBy,
  storeType,
}: {
  keyword?: string;
  page: number;
  size: number;
  sortBy: string;
  storeType?: AdminStoreType;
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

  return requestJson<StoreListResponse>(`/admin/stores?${params.toString()}`, {
    timeoutMs: 8000,
  });
};

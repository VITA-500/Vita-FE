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
const STORE_SCAN_PAGE_SIZE = 100;

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
    const targetOffset = page * size;
    const stores: AdminStore[] = [];
    let matchingStoreCount = 0;
    let scanPage = 0;
    let totalScanPages = 1;

    while (scanPage < totalScanPages) {
      const response = await fetchStoreListPage({
        keyword,
        page: scanPage,
        size: storeType ? STORE_SCAN_PAGE_SIZE : size,
        sortBy,
        storeType,
      });
      totalScanPages = Math.max(1, response.totalPages);

      const normalizedStores = response.content.map((store) => ({
        ...store,
        storeType: store.storeType ?? ("PHONE" as const),
      }));

      if (!storeType) {
        stores.push(...normalizedStores);
        matchingStoreCount = response.totalCount;
        break;
      }

      for (const store of normalizedStores) {
        if (store.storeType !== storeType) continue;

        if (matchingStoreCount >= targetOffset && stores.length < size) {
          stores.push(store);
        }

        matchingStoreCount += 1;
      }

      scanPage += 1;
    }

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
    const filteredDetails = details.filter(
      (store) => !storeType || store.storeType === storeType,
    );
    const visibleStoreIds = new Set(
      filteredDetails.map((store) => store.storeId),
    );
    const filteredStores = stores.filter((store) =>
      visibleStoreIds.has(store.storeId),
    );

    return {
      currentPage: page,
      stores: filteredStores,
      details: filteredDetails,
      totalCount: matchingStoreCount,
      totalPages: storeType
        ? Math.max(1, Math.ceil(matchingStoreCount / size))
        : totalScanPages,
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

"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  faqRows,
  storeDetails,
  storeRows,
} from "@/features/admin/constants/adminData";
import { adminFaqService } from "@/features/admin/lib/adminFaqService";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import type {
  AdminFaq,
  AdminFaqCategory,
  AdminFaqStatus,
  AdminStore,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { env } from "@/shared/config/env";

type FaqSaveInput = Pick<AdminFaq, "category" | "question"> & {
  answer: string;
  subcategory?: string;
};

type StoreSaveInput = Omit<
  AdminStoreDetail,
  "createdAt" | "storeId" | "storeType" | "updatedAt"
>;
type StoreSortField = "createdAt" | "name" | "updatedAt";
type StoreSortDirection = "asc" | "desc";
type FaqSortField = "createdAt" | "updatedAt";
type FaqSortDirection = "asc" | "desc";
type FaqCategoryFilter = "ALL" | AdminFaqCategory;
type FaqStatusFilter = "ALL" | AdminFaqStatus;

type AdminDataContextValue = {
  faqs: AdminFaq[];
  addFaq: (input: FaqSaveInput) => Promise<void>;
  deleteFaq: (faqId: number) => Promise<void>;
  faqCategoryFilter: FaqCategoryFilter;
  faqError: string | null;
  faqKeyword: string;
  faqPage: number;
  faqPageSize: number;
  faqSortDirection: FaqSortDirection;
  faqSortField: FaqSortField;
  faqStatusFilter: FaqStatusFilter;
  faqTotalCount: number;
  faqTotalPages: number;
  isFaqLoading: boolean;
  refreshFaqs: () => Promise<void>;
  saveFaq: (faqId: number, input: FaqSaveInput) => Promise<void>;
  setFaqCategoryFilter: (category: FaqCategoryFilter) => void;
  setFaqKeyword: (keyword: string) => void;
  setFaqPage: (page: number) => void;
  setFaqPageSize: (pageSize: number) => void;
  setFaqSort: (field: FaqSortField, direction: FaqSortDirection) => void;
  setFaqStatus: (faqId: number, status: AdminFaq["status"]) => Promise<void>;
  setFaqStatusFilter: (status: FaqStatusFilter) => void;
  addStore: (input: StoreSaveInput) => Promise<void>;
  stores: AdminStore[];
  storeDetails: AdminStoreDetail[];
  storeError: string | null;
  storeKeyword: string;
  storePage: number;
  storePageSize: number;
  storeSortDirection: StoreSortDirection;
  storeSortField: StoreSortField;
  storeTypeFilter: AdminStoreType;
  storeTotalCount: number;
  storeTotalPages: number;
  isStoreLoading: boolean;
  getStoreDetail: (storeId: number) => AdminStoreDetail | undefined;
  refreshStores: () => Promise<void>;
  saveStore: (storeId: number, input: StoreSaveInput) => Promise<void>;
  saveStores: (inputs: Record<number, StoreSaveInput>) => Promise<void>;
  setStoreKeyword: (keyword: string) => void;
  setStorePage: (page: number) => void;
  setStorePageSize: (pageSize: number) => void;
  setStoreSort: (field: StoreSortField, direction: StoreSortDirection) => void;
  setStoreTypeFilter: (storeType: AdminStoreType) => void;
  deleteStore: (storeId: number) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [faqs, setFaqs] = useState<AdminFaq[]>(env.apiBaseUrl ? [] : faqRows);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [faqKeyword, setFaqKeywordState] = useState("");
  const [faqPage, setFaqPage] = useState(0);
  const [faqPageSize, setFaqPageSizeState] = useState(20);
  const [faqCategoryFilter, setFaqCategoryFilterState] =
    useState<FaqCategoryFilter>("ALL");
  const [faqStatusFilter, setFaqStatusFilterState] =
    useState<FaqStatusFilter>("ACTIVE");
  const [faqSortField, setFaqSortField] = useState<FaqSortField>("createdAt");
  const [faqSortDirection, setFaqSortDirection] =
    useState<FaqSortDirection>("desc");
  const [faqTotalCount, setFaqTotalCount] = useState(
    env.apiBaseUrl ? 0 : faqRows.length,
  );
  const [faqTotalPages, setFaqTotalPages] = useState(1);
  const [isFaqLoading, setIsFaqLoading] = useState(Boolean(env.apiBaseUrl));
  const [stores, setStores] = useState<AdminStore[]>(
    env.apiBaseUrl ? [] : storeRows,
  );
  const [storeDetailRows, setStoreDetailRows] = useState<AdminStoreDetail[]>(
    env.apiBaseUrl ? [] : storeDetails,
  );
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeKeyword, setStoreKeywordState] = useState("");
  const [storePage, setStorePage] = useState(0);
  const [storePageSize, setStorePageSizeState] = useState(20);
  const [storeSortField, setStoreSortField] =
    useState<StoreSortField>("createdAt");
  const [storeSortDirection, setStoreSortDirection] =
    useState<StoreSortDirection>("desc");
  const [storeTypeFilter, setStoreTypeFilterState] =
    useState<AdminStoreType>("PHONE");
  const [storeTotalCount, setStoreTotalCount] = useState(
    env.apiBaseUrl ? 0 : storeRows.length,
  );
  const [storeTotalPages, setStoreTotalPages] = useState(1);
  const [isStoreLoading, setIsStoreLoading] = useState(Boolean(env.apiBaseUrl));

  const refreshFaqs = useCallback(async () => {
    if (!env.apiBaseUrl) return;

    setIsFaqLoading(true);
    setFaqError(null);

    try {
      const nextFaqData = await adminFaqService.fetchFaqs({
        category: faqCategoryFilter === "ALL" ? undefined : faqCategoryFilter,
        keyword: faqKeyword,
        page: faqPage,
        size: faqPageSize,
        sortBy: `${faqSortField},${faqSortDirection}`,
        status: faqStatusFilter === "ALL" ? undefined : faqStatusFilter,
      });
      setFaqs(nextFaqData.content);
      setFaqTotalCount(nextFaqData.totalCount);
      setFaqTotalPages(Math.max(1, nextFaqData.totalPages));
    } catch (error) {
      setFaqError(
        error instanceof Error
          ? error.message
          : "FAQ 데이터를 불러오지 못했습니다.",
      );
      throw error;
    } finally {
      setIsFaqLoading(false);
    }
  }, [
    faqCategoryFilter,
    faqKeyword,
    faqPage,
    faqPageSize,
    faqSortDirection,
    faqSortField,
    faqStatusFilter,
  ]);

  const refreshStores = useCallback(async () => {
    if (!env.apiBaseUrl) return;

    setIsStoreLoading(true);
    setStoreError(null);

    try {
      const nextStoreData = await adminStoreService.fetchStores({
        keyword: storeKeyword,
        page: storePage,
        size: storePageSize,
        sortBy: `${storeSortField},${storeSortDirection}`,
        storeType: storeTypeFilter,
      });
      setStores(nextStoreData.stores);
      setStoreDetailRows(nextStoreData.details);
      setStoreTotalCount(nextStoreData.totalCount);
      setStoreTotalPages(Math.max(1, nextStoreData.totalPages));
    } catch (error) {
      setStoreError(
        error instanceof Error
          ? error.message
          : "매장 데이터를 불러오지 못했습니다.",
      );
      throw error;
    } finally {
      setIsStoreLoading(false);
    }
  }, [
    storeKeyword,
    storePage,
    storePageSize,
    storeSortDirection,
    storeSortField,
    storeTypeFilter,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshFaqs().catch(() => {
        // API 연결 전 환경에서는 기존 데모 데이터를 유지합니다.
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshFaqs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshStores().catch(() => {
        // API 연결 전 환경에서는 기존 데모 데이터를 유지합니다.
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshStores]);

  const setFaqKeyword = useCallback((keyword: string) => {
    setFaqKeywordState(keyword);
    setFaqPage(0);
  }, []);

  const setFaqPageSize = useCallback((pageSize: number) => {
    setFaqPageSizeState(pageSize);
    setFaqPage(0);
  }, []);

  const setFaqCategoryFilter = useCallback((category: FaqCategoryFilter) => {
    setFaqCategoryFilterState(category);
    setFaqPage(0);
  }, []);

  const setFaqStatusFilter = useCallback((status: FaqStatusFilter) => {
    setFaqStatusFilterState(status);
    setFaqPage(0);
  }, []);

  const setFaqSort = useCallback(
    (field: FaqSortField, direction: FaqSortDirection) => {
      setFaqSortField(field);
      setFaqSortDirection(direction);
      setFaqPage(0);
    },
    [],
  );

  const setStoreKeyword = useCallback((keyword: string) => {
    setStoreKeywordState(keyword);
    setStorePage(0);
  }, []);

  const setStorePageSize = useCallback((pageSize: number) => {
    setStorePageSizeState(pageSize);
    setStorePage(0);
  }, []);

  const setStoreSort = useCallback(
    (field: StoreSortField, direction: StoreSortDirection) => {
      setStoreSortField(field);
      setStoreSortDirection(direction);
      setStorePage(0);
    },
    [],
  );

  const setStoreTypeFilter = useCallback((storeType: AdminStoreType) => {
    setStoreTypeFilterState(storeType);
    setStoreKeywordState("");
    setStorePage(0);
  }, []);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      faqs,
      addFaq: async (input) => {
        if (env.apiBaseUrl) {
          await adminFaqService.createFaq(input);
          await refreshFaqs();
          return;
        }

        const nextFaqId = Math.max(0, ...faqs.map((faq) => faq.faqId)) + 1;
        setFaqs([
          {
            ...input,
            faqId: nextFaqId,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...faqs,
        ]);
      },
      deleteFaq: async (faqId) => {
        if (env.apiBaseUrl) {
          await adminFaqService.deleteFaq(faqId);
          await refreshFaqs();
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status: "INACTIVE" } : faq,
          ),
        );
      },
      faqCategoryFilter,
      faqError,
      faqKeyword,
      faqPage,
      faqPageSize,
      faqSortDirection,
      faqSortField,
      faqStatusFilter,
      faqTotalCount,
      faqTotalPages,
      isFaqLoading,
      refreshFaqs,
      saveFaq: async (faqId, input) => {
        if (env.apiBaseUrl) {
          await adminFaqService.updateFaq(faqId, input);
          await refreshFaqs();
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, ...input } : faq,
          ),
        );
      },
      setFaqCategoryFilter,
      setFaqKeyword,
      setFaqPage,
      setFaqPageSize,
      setFaqSort,
      setFaqStatus: async (faqId, status) => {
        if (env.apiBaseUrl) {
          await adminFaqService.updateFaq(faqId, { status });
          await refreshFaqs();
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status } : faq,
          ),
        );
      },
      setFaqStatusFilter,
      addStore: async (input) => {
        await adminStoreService.createStore({
          ...input,
          storeType: storeTypeFilter,
        });
        await refreshStores();
      },
      stores,
      storeDetails: storeDetailRows,
      storeError,
      storeKeyword,
      storePage,
      storePageSize,
      storeSortDirection,
      storeSortField,
      storeTypeFilter,
      storeTotalCount,
      storeTotalPages,
      isStoreLoading,
      getStoreDetail: (storeId) =>
        storeDetailRows.find((store) => store.storeId === storeId),
      refreshStores,
      saveStore: async (storeId, input) => {
        const updatedStore = await adminStoreService.updateStore(
          storeId,
          input,
        );
        const nextStore = {
          ...input,
          storeId,
          createdAt:
            storeDetailRows.find((store) => store.storeId === storeId)
              ?.createdAt ?? new Date().toISOString(),
          storeType: storeTypeFilter,
          updatedAt: updatedStore.updatedAt,
        };

        setStoreSortField("updatedAt");
        setStoreSortDirection("desc");
        setStorePage(0);
        setStores((currentStores) => [
          nextStore,
          ...currentStores.filter((store) => store.storeId !== storeId),
        ]);
        setStoreDetailRows((currentDetails) => [
          nextStore,
          ...currentDetails.filter((store) => store.storeId !== storeId),
        ]);
        const nextStoreData = await adminStoreService.fetchStores({
          keyword: storeKeyword,
          page: 0,
          size: storePageSize,
          sortBy: "updatedAt,desc",
          storeType: storeTypeFilter,
        });
        const hasUpdatedStore = nextStoreData.stores.some(
          (store) => store.storeId === storeId,
        );

        setStores(
          hasUpdatedStore
            ? nextStoreData.stores
            : [nextStore, ...nextStoreData.stores].slice(0, storePageSize),
        );
        setStoreDetailRows(
          hasUpdatedStore
            ? nextStoreData.details
            : [nextStore, ...nextStoreData.details].slice(0, storePageSize),
        );
        setStoreTotalCount(nextStoreData.totalCount);
        setStoreTotalPages(Math.max(1, nextStoreData.totalPages));
      },
      saveStores: async (inputs) => {
        await Promise.all(
          Object.entries(inputs).map(([storeId, input]) =>
            adminStoreService.updateStore(Number(storeId), input),
          ),
        );
        await refreshStores();
      },
      setStoreKeyword,
      setStorePage,
      setStorePageSize,
      setStoreSort,
      setStoreTypeFilter,
      deleteStore: async (storeId) => {
        await adminStoreService.deleteStore(storeId);
        await refreshStores();
      },
    }),
    [
      faqCategoryFilter,
      faqError,
      faqKeyword,
      faqPage,
      faqPageSize,
      faqSortDirection,
      faqSortField,
      faqStatusFilter,
      faqTotalCount,
      faqTotalPages,
      faqs,
      isFaqLoading,
      isStoreLoading,
      refreshFaqs,
      refreshStores,
      setFaqCategoryFilter,
      setFaqKeyword,
      setFaqPageSize,
      setFaqSort,
      setFaqStatusFilter,
      setStoreKeyword,
      setStorePageSize,
      setStoreSort,
      setStoreTypeFilter,
      storeDetailRows,
      storeError,
      storeKeyword,
      storePage,
      storePageSize,
      storeSortDirection,
      storeSortField,
      storeTypeFilter,
      stores,
      storeTotalCount,
      storeTotalPages,
    ],
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }

  return context;
};

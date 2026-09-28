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
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import type {
  AdminFaq,
  AdminStore,
  AdminStoreDetail,
} from "@/features/admin/types";
import { env } from "@/shared/config/env";

type FaqSaveInput = Pick<AdminFaq, "answer" | "category" | "question"> & {
  subcategory?: string;
};

type StoreSaveInput = Omit<AdminStoreDetail, "storeId">;

type AdminDataContextValue = {
  faqs: AdminFaq[];
  addFaq: (input: FaqSaveInput) => void;
  saveFaq: (faqId: number, input: FaqSaveInput) => void;
  setFaqStatus: (faqId: number, status: AdminFaq["status"]) => void;
  deleteFaq: (faqId: number) => void;
  addStore: (input: StoreSaveInput) => Promise<void>;
  stores: AdminStore[];
  storeDetails: AdminStoreDetail[];
  storeError: string | null;
  storeKeyword: string;
  storePage: number;
  storePageSize: number;
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
  deleteStore: (storeId: number) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [faqs, setFaqs] = useState<AdminFaq[]>(faqRows);
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
  const [storeTotalCount, setStoreTotalCount] = useState(
    env.apiBaseUrl ? 0 : storeRows.length,
  );
  const [storeTotalPages, setStoreTotalPages] = useState(1);
  const [isStoreLoading, setIsStoreLoading] = useState(Boolean(env.apiBaseUrl));

  const refreshStores = useCallback(async () => {
    if (!env.apiBaseUrl) return;

    setIsStoreLoading(true);
    setStoreError(null);

    try {
      const nextStoreData = await adminStoreService.fetchStores({
        keyword: storeKeyword,
        page: storePage,
        size: storePageSize,
        sortBy: "createdAt,desc",
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
  }, [storeKeyword, storePage, storePageSize]);

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

  const setStoreKeyword = useCallback((keyword: string) => {
    setStoreKeywordState(keyword);
    setStorePage(0);
  }, []);

  const setStorePageSize = useCallback((pageSize: number) => {
    setStorePageSizeState(pageSize);
    setStorePage(0);
  }, []);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      faqs,
      addFaq: (input) => {
        setFaqs((currentFaqs) => {
          const nextFaqId =
            Math.max(0, ...currentFaqs.map((faq) => faq.faqId)) + 1;

          return [
            {
              ...input,
              faqId: nextFaqId,
              status: "ACTIVE",
              createdAt: new Date().toISOString(),
            },
            ...currentFaqs,
          ];
        });
      },
      saveFaq: (faqId, input) => {
        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, ...input } : faq,
          ),
        );
      },
      setFaqStatus: (faqId, status) => {
        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status } : faq,
          ),
        );
      },
      deleteFaq: (faqId) => {
        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status: "INACTIVE" } : faq,
          ),
        );
      },
      addStore: async (input) => {
        await adminStoreService.createStore(input);
        await refreshStores();
      },
      stores,
      storeDetails: storeDetailRows,
      storeError,
      storeKeyword,
      storePage,
      storePageSize,
      storeTotalCount,
      storeTotalPages,
      isStoreLoading,
      getStoreDetail: (storeId) =>
        storeDetailRows.find((store) => store.storeId === storeId),
      refreshStores,
      saveStore: async (storeId, input) => {
        await adminStoreService.updateStore(storeId, input);
        await refreshStores();
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
      deleteStore: async (storeId) => {
        await adminStoreService.deleteStore(storeId);
        await refreshStores();
      },
    }),
    [
      faqs,
      isStoreLoading,
      refreshStores,
      setStoreKeyword,
      setStorePageSize,
      storeDetailRows,
      storeError,
      storeKeyword,
      storePage,
      storePageSize,
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

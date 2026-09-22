"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  faqRows,
  storeDetails,
  storeRows,
} from "@/features/admin/constants/adminData";
import type {
  AdminFaq,
  AdminStore,
  AdminStoreDetail,
} from "@/features/admin/types";

type FaqSaveInput = Pick<AdminFaq, "category" | "question"> & {
  subcategory?: string;
};

type StoreSaveInput = Omit<AdminStoreDetail, "storeId">;

type AdminDataContextValue = {
  faqs: AdminFaq[];
  addFaq: (input: FaqSaveInput) => void;
  saveFaq: (faqId: number, input: FaqSaveInput) => void;
  setFaqStatus: (faqId: number, status: AdminFaq["status"]) => void;
  deleteFaq: (faqId: number) => void;
  addStore: (input: StoreSaveInput) => void;
  stores: AdminStore[];
  storeDetails: AdminStoreDetail[];
  getStoreDetail: (storeId: number) => AdminStoreDetail | undefined;
  saveStore: (storeId: number, input: StoreSaveInput) => void;
  saveStores: (inputs: Record<number, StoreSaveInput>) => void;
  deleteStore: (storeId: number) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [faqs, setFaqs] = useState<AdminFaq[]>(faqRows);
  const [stores, setStores] = useState<AdminStore[]>(storeRows);
  const [storeDetailRows, setStoreDetailRows] =
    useState<AdminStoreDetail[]>(storeDetails);

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
      addStore: (input) => {
        setStores((currentStores) => {
          const nextStoreId =
            Math.max(0, ...currentStores.map((store) => store.storeId)) + 1;
          const nextStore = {
            storeId: nextStoreId,
            name: input.name,
            address: input.address,
          };

          setStoreDetailRows((currentDetails) => [
            {
              ...nextStore,
              lat: input.lat,
              lng: input.lng,
              businessHours: input.businessHours,
              phone: input.phone,
              consultServices: input.consultServices,
              providedServices: input.providedServices,
            },
            ...currentDetails,
          ]);
          return [nextStore, ...currentStores];
        });
      },
      stores,
      storeDetails: storeDetailRows,
      getStoreDetail: (storeId) =>
        storeDetailRows.find((store) => store.storeId === storeId),
      saveStore: (storeId, input) => {
        setStores((currentStores) =>
          currentStores.map((store) =>
            store.storeId === storeId
              ? { ...store, name: input.name, address: input.address }
              : store,
          ),
        );
        setStoreDetailRows((currentDetails) =>
          currentDetails.map((store) =>
            store.storeId === storeId ? { ...store, ...input } : store,
          ),
        );
      },
      saveStores: (inputs) => {
        setStores((currentStores) =>
          currentStores.map((store) =>
            inputs[store.storeId]
              ? {
                  ...store,
                  name: inputs[store.storeId].name,
                  address: inputs[store.storeId].address,
                }
              : store,
          ),
        );
        setStoreDetailRows((currentDetails) =>
          currentDetails.map((store) =>
            inputs[store.storeId]
              ? { ...store, ...inputs[store.storeId] }
              : store,
          ),
        );
      },
      deleteStore: (storeId) => {
        setStores((currentStores) =>
          currentStores.filter((store) => store.storeId !== storeId),
        );
        setStoreDetailRows((currentDetails) =>
          currentDetails.filter((store) => store.storeId !== storeId),
        );
      },
    }),
    [faqs, storeDetailRows, stores],
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

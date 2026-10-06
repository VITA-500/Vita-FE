"use client";

import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { AdminDataContextValue } from "@/features/admin/context/adminDataTypes";
import { useAdminFaqData } from "@/features/admin/context/useAdminFaqData";
import {
  getInitialStoreType,
  useAdminStoreData,
} from "@/features/admin/context/useAdminStoreData";

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const faqData = useAdminFaqData();
  const storeData = useAdminStoreData(getInitialStoreType(pathname));
  const value = useMemo<AdminDataContextValue>(
    () => ({
      ...faqData,
      ...storeData,
    }),
    [faqData, storeData],
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

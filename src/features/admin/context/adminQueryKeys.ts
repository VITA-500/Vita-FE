import type {
  FaqCategoryFilter,
  FaqSortDirection,
  FaqSortField,
  FaqStatusFilter,
  StoreSortDirection,
  StoreSortField,
} from "@/features/admin/context/adminDataTypes";
import type { AdminStoreType } from "@/features/admin/types";

export const adminQueryKeys = {
  faqs: ({
    category,
    keyword,
    page,
    pageSize,
    sortDirection,
    sortField,
    status,
  }: {
    category: FaqCategoryFilter;
    keyword: string;
    page: number;
    pageSize: number;
    sortDirection: FaqSortDirection;
    sortField: FaqSortField;
    status: FaqStatusFilter;
  }) =>
    [
      "admin",
      "faqs",
      { category, keyword, page, pageSize, sortDirection, sortField, status },
    ] as const,
  stores: ({
    keyword,
    page,
    pageSize,
    sortDirection,
    sortField,
    storeType,
  }: {
    keyword: string;
    page: number;
    pageSize: number;
    sortDirection: StoreSortDirection;
    sortField: StoreSortField;
    storeType: AdminStoreType;
  }) =>
    [
      "admin",
      "stores",
      { keyword, page, pageSize, sortDirection, sortField, storeType },
    ] as const,
};

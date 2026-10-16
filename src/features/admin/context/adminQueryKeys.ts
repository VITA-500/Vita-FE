import type {
  FaqCategoryFilter,
  FaqSortDirection,
  FaqSortField,
  FaqStatusFilter,
  StoreSortDirection,
  StoreSortField,
} from "@/features/admin/context/adminDataTypes";
import type { AdminStoreType } from "@/features/admin/types";
import type { AdminUserStatus } from "@/features/admin/types/adminUsers";

type AdminUserStatusFilter = AdminUserStatus | "";

export const adminQueryKeys = {
  benefitsAll: ["admin", "benefits"] as const,
  benefits: (params: {
    category: string;
    keyword: string;
    page: number;
    pageSize: number;
    sortBy: string;
  }) => ["admin", "benefits", params] as const,
  answerFeedbackAll: ["admin", "answerFeedback"] as const,
  answerFeedback: (limit: number) =>
    ["admin", "answerFeedback", { limit }] as const,
  userSummary: ["admin", "users", "summary"] as const,
  usersAll: ["admin", "users", "list"] as const,
  storeQuality: ["admin", "stores", "quality"] as const,
  users: (params: {
    keyword: string;
    page: number;
    pageSize: number;
    status: AdminUserStatusFilter;
  }) => ["admin", "users", params] as const,
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

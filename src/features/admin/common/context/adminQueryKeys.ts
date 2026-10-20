import type { AdminAnswerFeedbackReason } from "@/entities/feedback";
import type {
  FaqCategoryFilter,
  FaqSortDirection,
  FaqSortField,
  FaqStatusFilter,
  StoreSortDirection,
  StoreSortField,
} from "@/features/admin/common/context/adminDataTypes";
import type { AdminStoreType } from "@/features/admin/types";
import type { AdminUserStatus } from "@/entities/user";

type AdminUserStatusFilter = AdminUserStatus | "";

const faqsAll = ["admin", "faqs"] as const;
const storesAll = ["admin", "stores"] as const;
const benefitsAll = ["admin", "benefits"] as const;

export const adminQueryKeys = {
  faqsAll,
  storesAll,
  benefitsAll,
  benefits: (params: {
    category: string;
    keyword: string;
    page: number;
    pageSize: number;
    sortBy: string;
  }) => [...benefitsAll, params] as const,
  answerFeedbackAll: ["admin", "answerFeedback"] as const,
  answerFeedback: (limit: number, reason?: AdminAnswerFeedbackReason) =>
    ["admin", "answerFeedback", { limit, reason }] as const,
  userSummary: ["admin", "users", "summary"] as const,
  operationsSummary: ["admin", "operationsSummary"] as const,
  usersAll: ["admin", "users", "list"] as const,
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
      ...faqsAll,
      { category, keyword, page, pageSize, sortDirection, sortField, status },
    ] as const,
  stores: ({
    keyword,
    page,
    pageSize,
    sortDirection,
    sortField,
    storeType,
    category,
    benefitId,
  }: {
    keyword: string;
    page: number;
    pageSize: number;
    sortDirection: StoreSortDirection;
    sortField: StoreSortField;
    storeType: AdminStoreType;
    category?: string;
    benefitId?: number;
  }) =>
    [
      ...storesAll,
      {
        keyword,
        page,
        pageSize,
        sortDirection,
        sortField,
        storeType,
        category,
        benefitId,
      },
    ] as const,
};

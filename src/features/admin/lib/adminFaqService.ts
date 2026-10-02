import type {
  AdminFaq,
  AdminFaqCategory,
  AdminFaqCreateRequest,
  AdminFaqStatus,
  AdminFaqUpdateRequest,
  PageResponse,
} from "@/features/admin/types";
import { requestJson } from "@/shared/api/http";

type FetchFaqsParams = {
  category?: AdminFaqCategory;
  keyword?: string;
  page: number;
  size: number;
  status?: AdminFaqStatus;
  sortBy?: string;
};

export const adminFaqService = {
  fetchFaqs: async ({
    category,
    keyword,
    page,
    size,
    status,
    sortBy,
  }: FetchFaqsParams) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (keyword?.trim()) {
      params.set("keyword", keyword.trim());
    }

    if (category) {
      params.set("category", category);
    }

    if (status) {
      params.set("status", status);
    }

    if (sortBy) {
      params.set("sortBy", sortBy);
    }

    return requestJson<PageResponse<AdminFaq>>(
      `/admin/faqs?${params.toString()}`,
      { timeoutMs: 8000 },
    );
  },

  createFaq: async (input: AdminFaqCreateRequest) =>
    requestJson<AdminFaq>("/admin/faqs", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    }),

  updateFaq: async (faqId: number, input: Partial<AdminFaqUpdateRequest>) =>
    requestJson(`/admin/faqs/${faqId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    }),

  deleteFaq: async (faqId: number) =>
    requestJson(`/admin/faqs/${faqId}`, {
      method: "DELETE",
      timeoutMs: 8000,
    }),
};

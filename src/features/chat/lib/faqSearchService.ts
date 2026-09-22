import { requestJson } from "@/shared/api/http";

export type FaqSearchResult = {
  id: number;
  category: string;
  subcategory: string | null;
  question: string;
  answer: string;
};

type PageResponse<T> = {
  content: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export const faqSearchService = {
  search: (keyword: string) => {
    const params = new URLSearchParams({
      keyword,
      page: "0",
      size: "3",
    });

    return requestJson<PageResponse<FaqSearchResult>>(
      `/search/faqs?${params.toString()}`,
      {
        timeoutMs: 5000,
      },
    );
  },
};

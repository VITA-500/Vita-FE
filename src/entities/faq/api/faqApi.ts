import type { FaqSearchResult } from "@/entities/faq/model/types";
import { requestJson } from "@/shared/api/http";
import type { PageResponse } from "@/shared/api/response";

/** 사용자용 FAQ 검색 API */
export const faqApi = {
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

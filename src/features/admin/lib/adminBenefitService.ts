import type {
  AdminBenefitDetail,
  AdminBenefitRequest,
  PageResponse,
} from "@/features/admin/types";
import { requestJson } from "@/shared/api/http";

/** BE BenefitService: size는 1~100 */
export const ADMIN_BENEFIT_MAX_PAGE_SIZE = 100;

type FetchBenefitsParams = {
  category?: string;
  keyword?: string;
  page: number;
  size: number;
  /** "createdAt,desc" | "updatedAt,desc" | "brand,asc" 등. 없으면 BE 기본(createdAt,desc) */
  sortBy?: string;
};

/** 관리자 제휴 혜택(브랜드) 관리 API (/admin/benefits) */
export const adminBenefitService = {
  fetchBenefits: ({
    category,
    keyword,
    page,
    size,
    sortBy,
  }: FetchBenefitsParams) => {
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

    if (sortBy) {
      params.set("sortBy", sortBy);
    }

    return requestJson<PageResponse<AdminBenefitDetail>>(
      `/admin/benefits?${params.toString()}`,
      { timeoutMs: 8000 },
    );
  },

  /** 같은 브랜드명이 있으면 409 */
  createBenefit: (input: AdminBenefitRequest) =>
    requestJson<AdminBenefitDetail>("/admin/benefits", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    }),

  /** 브랜드명을 바꿔도 매장 연결은 id 기준이라 그대로 유지된다. 다른 혜택과 브랜드명이 같으면 409 */
  updateBenefit: (benefitId: number, input: AdminBenefitRequest) =>
    requestJson<AdminBenefitDetail>(`/admin/benefits/${benefitId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      timeoutMs: 8000,
    }),

  /** 연결된 제휴 매장이 있으면 409 */
  deleteBenefit: (benefitId: number) =>
    requestJson<{ benefitId: number; deleted: boolean }>(
      `/admin/benefits/${benefitId}`,
      { method: "DELETE", timeoutMs: 8000 },
    ),
};

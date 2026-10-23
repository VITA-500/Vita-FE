import { toBenefitCategoryOptions } from "@/entities/benefit/model/categoryOptions";
import { demoBenefitCategories } from "@/entities/benefit/model/demoBenefits";
import type { BenefitSummary } from "@/entities/benefit/model/types";
import { requestJson } from "@/shared/api/http";

type BenefitListResponse = {
  benefits: BenefitSummary[];
};

/** 혜택 목록. category를 주면 그 카테고리만 받는다. */
const fetchBenefits = async ({
  category,
  timeoutMs = 8000,
}: { category?: string; timeoutMs?: number } = {}) => {
  const params = new URLSearchParams();

  if (category?.trim()) {
    params.set("category", category.trim());
  }

  const query = params.toString();
  const response = await requestJson<BenefitListResponse>(
    `/benefits/list${query ? `?${query}` : ""}`,
    { timeoutMs },
  );

  return response.benefits;
};

/** 제휴 혜택 API (/benefits). 매장 지도·채팅·관리자 화면이 함께 쓴다. */
export const benefitApi = {
  fetchBenefits,
  /** 혜택 카테고리 선택지(카테고리별 제휴 매장 수 포함) */
  fetchBenefitCategories: async () => {
    try {
      return toBenefitCategoryOptions(await fetchBenefits({ timeoutMs: 7000 }));
    } catch {
      return demoBenefitCategories;
    }
  },
};

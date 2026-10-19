// 리팩토링 기간 임시 경로입니다. 새 경로: 혜택 카테고리는 @/entities/benefit, 제휴 매장은 @/entities/store
// docs/Architecture.md Migration 7단계에서 삭제합니다.
import { benefitApi, type BenefitCategoryOption } from "@/entities/benefit";
import { storeApi } from "@/entities/store";

export type { BenefitCategoryOption };

export const benefitService = {
  fetchBenefitCategories: benefitApi.fetchBenefitCategories,
  fetchBenefitStores: storeApi.fetchBenefitStores,
};

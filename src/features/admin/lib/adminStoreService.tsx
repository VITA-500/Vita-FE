// 리팩토링 기간 임시 경로입니다. 새 경로: @/entities/store (adminStoreApi)
// docs/Architecture.md Migration 7단계에서 삭제합니다.
import { benefitApi } from "@/entities/benefit";
import { adminStoreApi } from "@/entities/store";

export const adminStoreService = {
  ...adminStoreApi,
  /** 매장 폼의 혜택 선택지. /benefits/list 조회는 entities/benefit 하나로 모았다. */
  fetchBenefits: (category?: string) => benefitApi.fetchBenefits({ category }),
};

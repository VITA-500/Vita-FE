import type {
  BenefitCategoryOption,
  BenefitSummary,
} from "@/entities/benefit/model/types";

/** 혜택 목록을 카테고리별로 묶고 제휴 매장 수를 더한다. 처음 나온 카테고리 순서를 유지한다. */
export const toBenefitCategoryOptions = (
  benefits: BenefitSummary[],
): BenefitCategoryOption[] => {
  const categoryMap = new Map<string, number>();

  benefits.forEach((benefit) => {
    categoryMap.set(
      benefit.category,
      (categoryMap.get(benefit.category) ?? 0) + benefit.storeCount,
    );
  });

  return Array.from(categoryMap.entries()).map(([category, storeCount]) => ({
    label: category,
    value: category,
    storeCount,
  }));
};

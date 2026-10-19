"use client";

import { useQuery } from "@tanstack/react-query";
import { benefitApi } from "@/entities/benefit/api/benefitApi";

export const benefitQueryKeys = {
  all: ["benefit"] as const,
  categories: () => [...benefitQueryKeys.all, "categories"] as const,
};

/** 혜택 카테고리 선택지(카테고리별 제휴 매장 수 포함). 자주 바뀌지 않아 오래 캐시한다. */
export const useBenefitCategoriesQuery = () =>
  useQuery({
    queryFn: benefitApi.fetchBenefitCategories,
    queryKey: benefitQueryKeys.categories(),
    retry: false,
    staleTime: 10 * 60_000,
  });

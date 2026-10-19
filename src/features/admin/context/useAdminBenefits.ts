"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { invalidateStoreBenefits } from "@/features/admin/context/invalidateStoreBenefits";
import { adminBenefitApi } from "@/entities/benefit";
import type {
  AdminBenefitCategory,
  AdminBenefitRequest,
} from "@/features/admin/types";
import { env } from "@/shared/config/env";

export type BenefitCategoryFilter = "ALL" | AdminBenefitCategory;
export type BenefitSort = "createdAt,desc" | "updatedAt,desc" | "brand,asc";

/**
 * 관리자 제휴 혜택 목록(검색·카테고리·정렬·페이지)과 등록·수정·삭제.
 * 등록·수정·삭제가 끝나면 목록을 다시 불러온다. 실패하면 BE 오류(ApiError)를 그대로 던진다.
 */
export const useAdminBenefits = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeywordState] = useState("");
  const [categoryFilter, setCategoryFilterState] =
    useState<BenefitCategoryFilter>("ALL");
  const [sort, setSortState] = useState<BenefitSort>("createdAt,desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);

  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryFn: () =>
      adminBenefitApi.fetchBenefits({
        category: categoryFilter === "ALL" ? undefined : categoryFilter,
        keyword,
        page,
        size: pageSize,
        sortBy: sort,
      }),
    queryKey: adminQueryKeys.benefits({
      category: categoryFilter,
      keyword,
      page,
      pageSize,
      sortBy: sort,
    }),
  });

  const refresh = () => invalidateStoreBenefits(queryClient);

  // 검색·필터·정렬·페이지 크기가 바뀌면 첫 페이지부터 다시 본다.
  // (검색어 setter는 입력 지연 effect의 의존성이라 렌더마다 새로 만들지 않는다)
  const setKeyword = useCallback((nextKeyword: string) => {
    setKeywordState(nextKeyword);
    setPage(0);
  }, []);
  const setCategoryFilter = (nextCategory: BenefitCategoryFilter) => {
    setCategoryFilterState(nextCategory);
    setPage(0);
  };
  const setSort = (nextSort: BenefitSort) => {
    setSortState(nextSort);
    setPage(0);
  };
  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPage(0);
  };

  return {
    benefits: query.data?.content ?? [],
    categoryFilter,
    error: !env.apiBaseUrl
      ? "API가 연결된 환경에서만 제휴 혜택을 관리할 수 있어요."
      : query.error
        ? "제휴 혜택을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        : null,
    isLoading: Boolean(env.apiBaseUrl) && (query.isLoading || query.isFetching),
    keyword,
    page,
    pageSize,
    sort,
    totalCount: query.data?.totalCount ?? 0,
    totalPages: Math.max(1, query.data?.totalPages ?? 1),
    setCategoryFilter,
    setKeyword,
    setPage,
    setPageSize,
    setSort,
    createBenefit: async (input: AdminBenefitRequest) => {
      await adminBenefitApi.createBenefit(input);
      await refresh();
    },
    updateBenefit: async (benefitId: number, input: AdminBenefitRequest) => {
      await adminBenefitApi.updateBenefit(benefitId, input);
      await refresh();
    },
    deleteBenefit: async (benefitId: number) => {
      await adminBenefitApi.deleteBenefit(benefitId);
      await refresh();
    },
  };
};

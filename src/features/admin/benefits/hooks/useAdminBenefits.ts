"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { invalidateStoreBenefits } from "@/features/admin/common/lib/invalidateStoreBenefits";
import { adminBenefitApi } from "@/entities/benefit";
import { env } from "@/shared/config/env";
import { previewBenefits } from "@/features/admin/common/lib/adminPreviewData";
import { previewStoreDetails } from "@/features/admin/common/lib/adminPreviewData";
import { useAdminPreviewState } from "@/features/admin/common/hooks/useAdminPreviewState";
import type {
  AdminBenefitCategory,
  AdminBenefitRequest,
} from "@/entities/benefit";

export type BenefitCategoryFilter = "ALL" | AdminBenefitCategory;
export type BenefitSort = "createdAt,desc" | "updatedAt,desc" | "brand,asc";

/**
 * 관리자 제휴 혜택 목록(검색·카테고리·정렬·페이지)과 등록·수정·삭제.
 * 등록·수정·삭제가 끝나면 목록을 다시 불러온다. 실패하면 BE 오류(ApiError)를 그대로 던진다.
 */
export const useAdminBenefits = () => {
  const queryClient = useQueryClient();
  const [localBenefits, setLocalBenefits] = useAdminPreviewState(
    "benefits",
    previewBenefits,
  );
  const [previewStores] = useAdminPreviewState(
    "store-details",
    previewStoreDetails,
  );
  const benefitsWithCounts = localBenefits.map((benefit) => ({
    ...benefit,
    storeCount: previewStores.filter(
      (store) => store.benefitId === benefit.benefitId,
    ).length,
  }));
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
  const setKeyword = useCallback(
    (nextKeyword: string) => {
      setKeywordState(nextKeyword);
      setPage(0);
    },
    [setPage, setKeywordState],
  );
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

  const filtered = benefitsWithCounts
    .filter(
      (row) =>
        (categoryFilter === "ALL" || row.category === categoryFilter) &&
        `${row.brand} ${row.name}`
          .toLowerCase()
          .includes(keyword.toLowerCase()),
    )
    .sort((a, b) => {
      const [field, direction] = sort.split(",");
      const result = String(a[field as keyof typeof a] ?? "").localeCompare(
        String(b[field as keyof typeof b] ?? ""),
      );
      return direction === "asc" ? result : -result;
    });
  return {
    benefits: env.apiBaseUrl
      ? (query.data?.content ?? [])
      : filtered.slice(page * pageSize, (page + 1) * pageSize),
    categoryFilter,
    error: !env.apiBaseUrl
      ? null
      : query.error
        ? "제휴 혜택을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        : null,
    isLoading: Boolean(env.apiBaseUrl) && (query.isLoading || query.isFetching),
    keyword,
    page,
    pageSize,
    sort,
    totalCount: env.apiBaseUrl
      ? (query.data?.totalCount ?? 0)
      : filtered.length,
    totalPages: Math.max(
      1,
      env.apiBaseUrl
        ? (query.data?.totalPages ?? 1)
        : Math.ceil(filtered.length / pageSize),
    ),
    setCategoryFilter,
    setKeyword,
    setPage,
    setPageSize,
    setSort,
    createBenefit: async (input: AdminBenefitRequest) => {
      if (!env.apiBaseUrl) {
        setLocalBenefits((rows) => [
          {
            ...input,
            description: input.description ?? null,
            benefitId: Math.max(0, ...rows.map((row) => row.benefitId)) + 1,
            storeCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...rows,
        ]);
        return;
      }
      await adminBenefitApi.createBenefit(input);
      await refresh();
    },
    updateBenefit: async (benefitId: number, input: AdminBenefitRequest) => {
      if (!env.apiBaseUrl) {
        setLocalBenefits((rows) =>
          rows.map((row) =>
            row.benefitId === benefitId
              ? {
                  ...row,
                  ...input,
                  description: input.description ?? null,
                  updatedAt: new Date().toISOString(),
                }
              : row,
          ),
        );
        return;
      }
      await adminBenefitApi.updateBenefit(benefitId, input);
      await refresh();
    },
    deleteBenefit: async (benefitId: number) => {
      if (!env.apiBaseUrl) {
        if (
          benefitsWithCounts.find((row) => row.benefitId === benefitId)
            ?.storeCount
        )
          throw new Error("연결된 제휴점이 있는 혜택은 삭제할 수 없어요.");
        setLocalBenefits((rows) =>
          rows.filter((row) => row.benefitId !== benefitId),
        );
        return;
      }
      await adminBenefitApi.deleteBenefit(benefitId);
      await refresh();
    },
  };
};

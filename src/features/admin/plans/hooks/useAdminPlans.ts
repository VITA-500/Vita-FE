"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminPlanApi, type AdminPlanRequest } from "@/entities/plan";
import type { PlanStatus, PlanTargetGroup } from "@/entities/plan";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { env } from "@/shared/config/env";
import { previewPlans } from "@/features/admin/common/lib/adminPreviewData";
import { useAdminPreviewState } from "@/features/admin/common/hooks/useAdminPreviewState";

// 대상 필터는 서버의 모든 페이지를 조회한 후 적용한다.
const TARGET_GROUP_PAGE_SIZE = 100;

export const useAdminPlans = () => {
  const client = useQueryClient();
  const [localPlans, setLocalPlans] = useAdminPreviewState(
    "plans",
    previewPlans,
  );
  const [keyword, setKeywordState] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [targetGroup, setTargetGroupState] = useState<PlanTargetGroup | "">("");
  const params = { keyword, page, pageSize, sortBy, targetGroup };
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.plans({
      ...params,
      page: targetGroup ? 0 : page,
      pageSize: targetGroup ? TARGET_GROUP_PAGE_SIZE : pageSize,
    }),
    queryFn: async () => {
      const first = await adminPlanApi.fetchPlans({
        page: targetGroup ? 0 : page,
        size: targetGroup ? TARGET_GROUP_PAGE_SIZE : pageSize,
        keyword,
        sortBy,
      });
      if (!targetGroup) return first;
      const content = [...first.content];
      for (let nextPage = 1; nextPage < first.totalPages; nextPage++) {
        const next = await adminPlanApi.fetchPlans({
          page: nextPage,
          size: TARGET_GROUP_PAGE_SIZE,
          keyword,
          sortBy,
        });
        content.push(...next.content);
      }
      return { ...first, content };
    },
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: adminQueryKeys.plansAll });
  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
    setPage(0);
  }, []);
  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPage(0);
  };
  const setSort = (value: string) => {
    setSortBy(value);
    setPage(0);
  };
  const setTargetGroup = (value: PlanTargetGroup | "") => {
    setTargetGroupState(value);
    setPage(0);
  };
  const serverPlans = env.apiBaseUrl
    ? (query.data?.content ?? [])
    : localPlans
        .filter((plan) =>
          `${plan.name} ${plan.summary}`
            .toLowerCase()
            .includes(keyword.toLowerCase()),
        )
        .sort((a, b) => {
          const [field, direction] = sortBy.split(",");
          const result =
            field === "price"
              ? a.price - b.price
              : String(a[field as keyof typeof a] ?? "").localeCompare(
                  String(b[field as keyof typeof b] ?? ""),
                );
          return direction === "asc" ? result : -result;
        });
  const filteredPlans = targetGroup
    ? serverPlans.filter((plan) => plan.targetGroup === targetGroup)
    : serverPlans;
  const totalCount = targetGroup
    ? filteredPlans.length
    : env.apiBaseUrl
      ? (query.data?.totalCount ?? 0)
      : filteredPlans.length;
  const totalPages = targetGroup
    ? Math.max(1, Math.ceil(totalCount / pageSize))
    : Math.max(
        1,
        env.apiBaseUrl
          ? (query.data?.totalPages ?? 1)
          : Math.ceil(totalCount / pageSize),
      );
  const visiblePlans =
    targetGroup || !env.apiBaseUrl
      ? filteredPlans.slice(page * pageSize, (page + 1) * pageSize)
      : filteredPlans;
  return {
    plans: visiblePlans,
    keyword,
    page,
    pageSize,
    sortBy,
    totalCount,
    totalPages,
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
    setKeyword,
    setPage,
    setPageSize,
    setSort,
    targetGroup,
    setTargetGroup,
    createPlan: async (input: AdminPlanRequest) => {
      if (!env.apiBaseUrl) {
        setLocalPlans((rows) => [
          {
            ...input,
            planId: Math.max(0, ...rows.map((row) => row.planId)) + 1,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: null,
          },
          ...rows,
        ]);
        return;
      }
      await adminPlanApi.createPlan(input);
      await refresh();
    },
    updatePlan: async (
      id: number,
      input: Partial<AdminPlanRequest> & { status?: PlanStatus },
    ) => {
      if (!env.apiBaseUrl) {
        setLocalPlans((rows) =>
          rows.map((row) =>
            row.planId === id
              ? { ...row, ...input, updatedAt: new Date().toISOString() }
              : row,
          ),
        );
        return;
      }
      await adminPlanApi.updatePlan(id, input);
      await refresh();
    },
    deactivatePlan: async (id: number) => {
      if (!env.apiBaseUrl) {
        setLocalPlans((rows) =>
          rows.map((row) =>
            row.planId === id ? { ...row, status: "INACTIVE" } : row,
          ),
        );
        return;
      }
      await adminPlanApi.deactivatePlan(id);
      await refresh();
    },
  };
};

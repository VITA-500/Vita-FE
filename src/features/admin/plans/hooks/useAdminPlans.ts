"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminPlanApi, type AdminPlanRequest } from "@/entities/plan";
import type { PlanStatus, PlanTargetGroup } from "@/entities/plan";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { env } from "@/shared/config/env";

// BE 목록 API에 targetGroup 필터가 없어 선택 시에만 제한적으로 FE 필터링한다.
const TARGET_GROUP_FILTER_LIMIT = 100;

export const useAdminPlans = () => {
  const client = useQueryClient();
  const [keyword, setKeywordState] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [targetGroup, setTargetGroupState] = useState<PlanTargetGroup | "">("");
  const params = { keyword, page, pageSize, sortBy, targetGroup };
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.plans(params),
    queryFn: () =>
      adminPlanApi.fetchPlans({
        page: targetGroup ? 0 : page,
        size: targetGroup ? TARGET_GROUP_FILTER_LIMIT : pageSize,
        keyword,
        sortBy,
      }),
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
  const serverPlans = query.data?.content ?? [];
  const filteredPlans = targetGroup
    ? serverPlans.filter((plan) => plan.targetGroup === targetGroup)
    : serverPlans;
  const totalCount = targetGroup
    ? filteredPlans.length
    : (query.data?.totalCount ?? 0);
  const totalPages = targetGroup
    ? Math.max(1, Math.ceil(totalCount / pageSize))
    : Math.max(1, query.data?.totalPages ?? 1);
  const visiblePlans = targetGroup
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
      await adminPlanApi.createPlan(input);
      await refresh();
    },
    updatePlan: async (
      id: number,
      input: Partial<AdminPlanRequest> & { status?: PlanStatus },
    ) => {
      await adminPlanApi.updatePlan(id, input);
      await refresh();
    },
    deactivatePlan: async (id: number) => {
      await adminPlanApi.deactivatePlan(id);
      await refresh();
    },
  };
};

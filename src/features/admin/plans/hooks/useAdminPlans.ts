"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminPlanApi, type AdminPlanRequest } from "@/entities/plan";
import type { PlanStatus, PlanTargetGroup } from "@/entities/plan";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { env } from "@/shared/config/env";
export const useAdminPlans = () => {
  const client = useQueryClient();
  const [keyword, setKeywordState] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [targetGroup, setTargetGroupState] = useState<PlanTargetGroup | "">("");
  const params = { keyword, page, pageSize, sortBy };
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.plans(params),
    queryFn: () =>
      adminPlanApi.fetchPlans({ page: 0, size: 100, keyword, sortBy }),
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
  const allPlans = query.data?.content ?? [];
  const filteredPlans = targetGroup
    ? allPlans.filter((plan) => plan.targetGroup === targetGroup)
    : allPlans;
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  return {
    plans: filteredPlans.slice(page * pageSize, (page + 1) * pageSize),
    keyword,
    page,
    pageSize,
    sortBy,
    totalCount: filteredPlans.length,
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

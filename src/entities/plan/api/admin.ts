import type {
  AdminPlan,
  AdminPlanRequest,
  PlanStatus,
} from "@/entities/plan/model/types";
import { requestJson } from "@/shared/api/http";
import type { PageResponse } from "@/shared/api/response";
export const adminPlanApi = {
  fetchPlans: (params: {
    page: number;
    size: number;
    keyword?: string;
    sortBy?: string;
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });
    if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
    if (params.sortBy) query.set("sortBy", params.sortBy);
    return requestJson<PageResponse<AdminPlan>>(`/admin/plans?${query}`, {
      timeoutMs: 8000,
    });
  },
  createPlan: (input: AdminPlanRequest) =>
    requestJson<AdminPlan>("/admin/plans", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 12000,
    }),
  updatePlan: (
    id: number,
    input: Partial<AdminPlanRequest> & { status?: PlanStatus },
  ) =>
    requestJson<{ planId: number; updatedAt: string }>(`/admin/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      timeoutMs: 12000,
    }),
  deactivatePlan: (id: number) =>
    requestJson<{ planId: number; deleted: boolean }>(`/admin/plans/${id}`, {
      method: "DELETE",
      timeoutMs: 8000,
    }),
};

"use client";

import { useQuery } from "@tanstack/react-query";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminUserService } from "@/features/admin/lib/adminUserService";
import { env } from "@/shared/config/env";

export const useAdminUserSummary = () => {
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.userSummary,
    queryFn: async () => {
      const [all, active, suspended, admins] = await Promise.all([
        adminUserService.fetchUsers({ page: 0, size: 1 }),
        adminUserService.fetchUsers({
          page: 0,
          size: 1,
          status: "ACTIVE",
        }),
        adminUserService.fetchUsers({
          page: 0,
          size: 1,
          status: "SUSPENDED",
        }),
        adminUserService.fetchUsers({ page: 0, size: 1, role: "ADMIN" }),
      ]);

      return {
        total: all.totalCount,
        active: active.totalCount,
        suspended: suspended.totalCount,
        admins: admins.totalCount,
      };
    },
  });

  return {
    error: query.error ? "회원 현황을 불러오지 못했어요." : null,
    isLoading: query.isPending,
    summary: query.data ?? null,
  };
};

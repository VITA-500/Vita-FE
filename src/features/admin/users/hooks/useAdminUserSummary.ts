"use client";

import { useQuery } from "@tanstack/react-query";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { adminUserApi } from "@/entities/user";
import { env } from "@/shared/config/env";
import { previewUsers } from "@/features/admin/common/lib/adminPreviewData";
import { useAdminPreviewState } from "@/features/admin/common/hooks/useAdminPreviewState";

export const useAdminUserSummary = () => {
  const [users] = useAdminPreviewState("users", previewUsers);
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.userSummary,
    queryFn: async () => {
      const [all, active, suspended, admins] = await Promise.all([
        adminUserApi.fetchUsers({ page: 0, size: 1 }),
        adminUserApi.fetchUsers({
          page: 0,
          size: 1,
          status: "ACTIVE",
        }),
        adminUserApi.fetchUsers({
          page: 0,
          size: 1,
          status: "SUSPENDED",
        }),
        adminUserApi.fetchUsers({ page: 0, size: 1, role: "ADMIN" }),
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
    isLoading: Boolean(env.apiBaseUrl) && query.isPending,
    summary: env.apiBaseUrl
      ? (query.data ?? null)
      : {
          total: users.length,
          active: users.filter((row) => row.status === "ACTIVE").length,
          suspended: users.filter((row) => row.status === "SUSPENDED").length,
          admins: users.filter((row) => row.role === "ADMIN").length,
        },
  };
};

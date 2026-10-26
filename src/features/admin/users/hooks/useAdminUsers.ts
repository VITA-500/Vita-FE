"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { adminUserApi, type AdminUserStatus } from "@/entities/user";
import { showToast } from "@/shared/providers/ToastProvider";
import { env } from "@/shared/config/env";
import { previewUsers } from "@/features/admin/common/lib/adminPreviewData";
import { useAdminPreviewState } from "@/features/admin/common/hooks/useAdminPreviewState";

export const useAdminUsers = () => {
  const queryClient = useQueryClient();
  const [localUsers, setLocalUsers] = useAdminPreviewState(
    "users",
    previewUsers,
  );
  const [keyword, setKeywordState] = useState("");
  const [status, setStatusState] = useState<AdminUserStatus | "">("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.users({ keyword, page, pageSize, status }),
    queryFn: () =>
      adminUserApi.fetchUsers({
        keyword,
        page,
        size: pageSize,
        status: status || undefined,
      }),
  });
  const mutation = useMutation({
    mutationFn: ({
      userId,
      nextStatus,
      reason,
    }: {
      userId: number;
      nextStatus: AdminUserStatus;
      reason: string;
    }) => adminUserApi.updateStatus(userId, nextStatus, reason),
    onSuccess: async () => {
      showToast("회원 상태를 변경했어요.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.userSummary }),
      ]);
    },
    onError: (error) =>
      showToast(
        error instanceof Error
          ? error.message
          : "회원 상태를 변경하지 못했어요.",
      ),
  });
  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
    setPage(0);
  }, []);
  const setStatus = useCallback((value: AdminUserStatus | "") => {
    setStatusState(value);
    setPage(0);
  }, []);

  const filtered = localUsers.filter(
    (row) =>
      (!status || row.status === status) &&
      `${row.name} ${row.email}`.toLowerCase().includes(keyword.toLowerCase()),
  );
  return {
    users: env.apiBaseUrl
      ? (query.data?.content ?? [])
      : filtered.slice(page * pageSize, (page + 1) * pageSize),
    totalCount: env.apiBaseUrl
      ? (query.data?.totalCount ?? 0)
      : filtered.length,
    totalPages: Math.max(
      1,
      env.apiBaseUrl
        ? (query.data?.totalPages ?? 1)
        : Math.ceil(filtered.length / pageSize),
    ),
    keyword,
    status,
    page,
    pageSize,
    isLoading: Boolean(env.apiBaseUrl) && query.isPending,
    refetch: () => {
      if (env.apiBaseUrl) return query.refetch();
    },
    error: query.error ? "회원 목록을 불러오지 못했어요." : null,
    setKeyword,
    setStatus,
    setPage,
    changeUserStatus: (
      userId: number,
      nextStatus: AdminUserStatus,
      reason: string,
    ) => {
      if (!env.apiBaseUrl) {
        setLocalUsers((rows) =>
          rows.map((row) =>
            row.userId === userId ? { ...row, status: nextStatus } : row,
          ),
        );
        return Promise.resolve();
      }
      return mutation.mutateAsync({ userId, nextStatus, reason });
    },
    changingUserId: mutation.isPending ? mutation.variables?.userId : undefined,
  };
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminUserService } from "@/features/admin/lib/adminUserService";
import type { AdminUserStatus } from "@/features/admin/types/adminUsers";
import { showToast } from "@/shared/providers/ToastProvider";

export const useAdminUsers = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeywordState] = useState("");
  const [status, setStatusState] = useState<AdminUserStatus | "">("");
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const query = useQuery({
    queryKey: adminQueryKeys.users({ keyword, page, pageSize, status }),
    queryFn: () =>
      adminUserService.fetchUsers({
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
    }) => adminUserService.updateStatus(userId, nextStatus, reason),
    onSuccess: async () => {
      showToast("회원 상태를 변경했어요.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersAll }),
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

  return {
    users: query.data?.content ?? [],
    totalCount: query.data?.totalCount ?? 0,
    totalPages: Math.max(1, query.data?.totalPages ?? 1),
    keyword,
    status,
    page,
    pageSize,
    isLoading: query.isPending,
    refetch: query.refetch,
    error: query.error ? "회원 목록을 불러오지 못했어요." : null,
    setKeyword,
    setStatus,
    setPage,
    changeUserStatus: (
      userId: number,
      nextStatus: AdminUserStatus,
      reason: string,
    ) => mutation.mutateAsync({ userId, nextStatus, reason }),
    changingUserId: mutation.isPending ? mutation.variables?.userId : undefined,
  };
};

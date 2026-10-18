"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockAnswerFeedbackStats } from "@/features/admin/constants/adminData";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminAnswerFeedbackService } from "@/features/admin/lib/adminAnswerFeedbackService";
import type { AdminAnswerFeedbackStats } from "@/features/admin/types";
import { ApiError } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { showToast } from "@/shared/providers/ToastProvider";

const toLimitedMock = (limit: number): AdminAnswerFeedbackStats => ({
  ...mockAnswerFeedbackStats,
  candidates: mockAnswerFeedbackStats.candidates.slice(0, limit),
});

/**
 * 관리자 답변 피드백 통계(GET /admin/stats/chat).
 * API 주소가 없는 환경(Storybook·로컬 목업)에서는 목데이터를 쓴다.
 */
export const useAdminAnswerFeedback = (limit: number) => {
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryFn: () => adminAnswerFeedbackService.fetchStats(limit),
    queryKey: adminQueryKeys.answerFeedback(limit),
  });

  if (!env.apiBaseUrl) {
    return {
      error: null,
      isLoading: false,
      refetch: query.refetch,
      stats: toLimitedMock(limit),
    };
  }

  return {
    error: query.error
      ? "답변 피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : null,
    isLoading: query.isPending,
    refetch: query.refetch,
    stats: query.data ?? null,
  };
};

/**
 * 답변 피드백 무시(PATCH /admin/stats/chat/{id}/dismiss).
 * 성공하면 limit과 상관없이 답변 피드백 통계를 모두 다시 불러온다(대시보드·답변 피드백 페이지). 같은 묶음에 자동 감지 기록도 있으면 항목은 목록에 남는다.
 */
export const useDismissAnswerFeedback = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => adminAnswerFeedbackService.dismiss(id),
    onSuccess: async ({ dismissedCount }) => {
      showToast(`아쉬워요 ${dismissedCount}건을 무시 처리했어요.`);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.answerFeedbackAll,
      });
    },
    onError: (error) => {
      showToast(
        error instanceof ApiError && error.status === 400
          ? error.message
          : "무시 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    },
  });

  return {
    dismiss: (id: number, options?: { onSettled?: () => void }) => {
      if (!env.apiBaseUrl) {
        showToast("API가 연결된 환경에서만 무시할 수 있어요.");
        options?.onSettled?.();
        return;
      }

      mutation.mutate(id, { onSettled: options?.onSettled });
    },
    dismissingId: mutation.isPending ? mutation.variables : undefined,
  };
};

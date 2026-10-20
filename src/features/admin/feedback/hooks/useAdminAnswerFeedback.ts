"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { mockAnswerFeedbackStats } from "@/features/admin/common/lib/adminData";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { adminAnswerFeedbackApi } from "@/entities/feedback";
import {
  filterAnswerFeedback,
  getAnswerFeedbackReasons,
  mergeAnswerFeedbackCandidates,
  withMatchedReasons,
  type AnswerFeedbackFilter,
  type AnswerFeedbackQualityFilter,
} from "@/features/admin/feedback/lib/answerFeedbackFilters";
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
    queryFn: () => adminAnswerFeedbackApi.fetchStats(limit),
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
 * 답변 피드백 페이지의 탭별 목록. 탭이 고른 사유로 서버에서 거른다(GET /admin/stats/chat?reason=).
 * 응답 품질 "전체"는 사유를 하나만 받는 BE에 맞춰 검색 결과 없음·유사도 낮음을 따로 받아 합친다.
 * summary는 reason과 관계없이 전체 기준이라 첫 응답의 값을 쓴다.
 * API 주소가 없는 환경에서는 목데이터를 최근 사유 기준으로 거른다.
 */
export const useAdminAnswerFeedbackList = ({
  filter,
  limit,
  qualityFilter,
}: {
  filter: AnswerFeedbackFilter;
  limit: number;
  qualityFilter: AnswerFeedbackQualityFilter;
}) => {
  const reasons = getAnswerFeedbackReasons(filter, qualityFilter);
  const queries = useQueries({
    queries: reasons.map((reason) => ({
      enabled: Boolean(env.apiBaseUrl),
      queryFn: () => adminAnswerFeedbackApi.fetchStats(limit, reason),
      queryKey: adminQueryKeys.answerFeedback(limit, reason),
    })),
  });

  if (!env.apiBaseUrl) {
    const stats = toLimitedMock(limit);

    return {
      candidates: (() => {
        const filtered = filterAnswerFeedback(
          stats.candidates,
          filter,
          qualityFilter,
        );
        // 목데이터는 최근 사유로 거르므로 걸린 사유도 최근 사유 하나다.
        return withMatchedReasons(
          filtered,
          reasons,
          reasons.map((reason) =>
            filtered.filter((candidate) => candidate.failReason === reason),
          ),
        );
      })(),
      error: null,
      isLoading: false,
      stats,
    };
  }

  const results = queries.map((query) => query.data);
  const stats = results[0] ?? null;
  const isLoading = queries.some((query) => query.isPending);
  const hasError = queries.some((query) => query.error);

  return {
    candidates:
      isLoading || results.some((result) => !result)
        ? []
        : withMatchedReasons(
            mergeAnswerFeedbackCandidates(
              results.map((result) => result?.candidates ?? []),
            ).slice(0, limit),
            reasons,
            results.map((result) => result?.candidates ?? []),
          ),
    error: hasError
      ? "답변 피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : null,
    isLoading,
    stats,
  };
};

/**
 * 답변 피드백 무시(PATCH /admin/stats/chat/{id}/dismiss).
 * 성공하면 limit과 상관없이 답변 피드백 통계를 모두 다시 불러온다(대시보드·답변 피드백 페이지).
 * 같은 질문 묶음의 자동 감지와 아쉬워요가 함께 목록에서 내려간다(2026-10-18 BE 확장).
 */
export const useDismissAnswerFeedback = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => adminAnswerFeedbackApi.dismiss(id),
    onSuccess: async ({ dismissedCount }) => {
      showToast(`피드백 ${dismissedCount}건을 무시 처리했어요.`);
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

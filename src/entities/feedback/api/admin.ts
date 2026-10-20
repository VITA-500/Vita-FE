import type {
  AdminAnswerFeedbackDismissResponse,
  AdminAnswerFeedbackReason,
  AdminAnswerFeedbackStats,
  AdminTraceDetail,
  AdminTraceListResponse,
} from "@/entities/feedback/model/types";
import { requestJson } from "@/shared/api/http";

/** BE ChatStatsService: limit은 1~200, 없으면 50. */
export const ADMIN_ANSWER_FEEDBACK_MAX_LIMIT = 200;

/** 관리자 답변 피드백 통계 API (/admin/stats/chat) */
export const adminAnswerFeedbackApi = {
  /**
   * 답변 피드백 통계. 자동 감지(검색 결과 없음·유사도 낮음·답변 실패)와 사용자 아쉬워요를 합친 결과.
   * reason을 주면 묶음 안에 그 사유가 하나라도 있는 항목만 받는다. summary는 reason과 관계없이 전체 기준.
   */
  fetchStats: (limit: number, reason?: AdminAnswerFeedbackReason) => {
    const params = new URLSearchParams({ limit: String(limit) });

    if (reason) params.set("reason", reason);

    return requestJson<AdminAnswerFeedbackStats>(
      `/admin/stats/chat?${params.toString()}`,
      { timeoutMs: 10000 },
    );
  },
  /**
   * 답변 피드백 무시: 같은 질문 묶음에 들어 있는 자동 감지(검색 결과 없음·유사도 낮음·답변 실패)와
   * 아쉬워요를 모두 목록에서 내린다(2026-10-18 BE 확장). 같은 질문이 새로 미해결로 나오면 다시 올라온다.
   */
  dismiss: (id: number) =>
    requestJson<AdminAnswerFeedbackDismissResponse>(
      `/admin/stats/chat/${id}/dismiss`,
      {
        method: "PATCH",
      },
    ),
  findTraceByMessageId: (messageId: number) =>
    requestJson<AdminTraceListResponse>(
      `/admin/traces?messageId=${messageId}&sortBy=id,desc&size=1`,
      { timeoutMs: 10000 },
    ),
  getTrace: (traceId: number) =>
    requestJson<AdminTraceDetail>(`/admin/traces/${traceId}`, {
      timeoutMs: 10000,
    }),
};

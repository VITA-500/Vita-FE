import type {
  AdminAnswerFeedbackDismissResponse,
  AdminAnswerFeedbackStats,
} from "@/entities/feedback/model/types";
import { requestJson } from "@/shared/api/http";

/** BE ChatStatsService: limit은 1~200, 없으면 50. */
export const ADMIN_ANSWER_FEEDBACK_MAX_LIMIT = 200;

/** 관리자 답변 피드백 통계 API (/admin/stats/chat) */
export const adminAnswerFeedbackApi = {
  /** 답변 피드백 통계. 자동 감지(검색 결과 없음·유사도 낮음·답변 실패)와 사용자 아쉬워요를 합친 결과. */
  fetchStats: (limit: number) =>
    requestJson<AdminAnswerFeedbackStats>(
      `/admin/stats/chat?${new URLSearchParams({ limit: String(limit) })}`,
      { timeoutMs: 10000 },
    ),
  /**
   * 답변 피드백 무시: 같은 질문 묶음에 들어 있는 "아쉬워요"를 모두 무시 처리한다.
   * 자동 감지(검색 결과 없음·유사도 낮음·답변 실패)만 있는 항목은 BE가 400을 돌려준다.
   */
  dismiss: (id: number) =>
    requestJson<AdminAnswerFeedbackDismissResponse>(
      `/admin/stats/chat/${id}/dismiss`,
      {
        method: "PATCH",
      },
    ),
};

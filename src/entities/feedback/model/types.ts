/** 사용자가 챗봇 답변에 남기는 평가 */
export type AnswerFeedback = "LIKE" | "DISLIKE";

/** POST /chat/messages/{messageId}/feedback 응답 */
export type AnswerFeedbackResponse = {
  messageId: number;
  feedback: AnswerFeedback | null;
  /** 저장된 아쉬워요 이유. 아쉬워요가 아니거나 이유가 없으면 null (2026-10-18 BE 반영) */
  comment?: string | null;
};

/** 아쉬워요 이유 최대 길이 (BE ChatFeedbackRequest: 0~200자) */
export const ANSWER_FEEDBACK_COMMENT_MAX_LENGTH = 200;

/** 답변 피드백 유형. BE UnresolvedReason과 같다(DISLIKED는 사용자가 "아쉬워요"를 누른 답변). */
export type AdminAnswerFeedbackReason =
  "NO_MATCH" | "LOW_SIMILARITY" | "ANSWER_FAILED" | "DISLIKED";

/** GET /admin/stats/chat 의 답변 피드백 항목(같은 질문끼리 묶음). BE 응답 필드 이름은 candidates. */
export type AdminAnswerFeedback = {
  /** 가장 최근에 나온 답변 메시지 id */
  id: number;
  question: string;
  /** 가장 최근에 나온 챗봇 답변 */
  answer: string | null;
  source: string;
  /** 가장 최근 발생의 사유 */
  failReason: AdminAnswerFeedbackReason | string;
  /** 같은 질문으로 들어온 피드백 횟수(답변 메시지 수) */
  count: number;
  lastOccurredAt: string;
  /** 같은 질문의 답변이 받은 좋아요 수(전체 기간). 2026-10-18 BE 반영, 예전 응답에는 없다. */
  likeCount?: number;
  /** 같은 질문의 답변이 받은 아쉬워요 수(전체 기간, 무시한 것 포함). */
  dislikeCount?: number;
  /** 아쉬워요 이유. 최근 순 최대 5개. */
  comments?: string[];
};

export type AdminAnswerFeedbackStats = {
  summary: {
    /** 답변 피드백 항목 수(같은 질문은 하나로) */
    unresolvedCount: number;
    /** 답변 피드백이 나온 전체 횟수 */
    repeatCount: number;
    /** 오늘 마지막으로 나온 답변 피드백 항목 수 */
    todayCount: number;
  };
  /** 많이 나온 순 */
  candidates: AdminAnswerFeedback[];
};

/** PATCH /admin/stats/chat/{id}/dismiss 응답 */
export type AdminAnswerFeedbackDismissResponse = {
  /** 무시한 항목 id (candidates[].id) */
  id: number;
  /** 목록에서 내린 답변 수. 자동 감지와 아쉬워요를 합친 수로 항목의 count와 같다. */
  dismissedCount: number;
};

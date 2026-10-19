/** 사용자가 챗봇 답변에 남기는 평가 */
export type AnswerFeedback = "LIKE" | "DISLIKE";

/** POST /chat/messages/{messageId}/feedback 응답 */
export type AnswerFeedbackResponse = {
  messageId: number;
  feedback: AnswerFeedback | null;
};

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
  /** 무시 처리된 "아쉬워요" 수 */
  dismissedCount: number;
};

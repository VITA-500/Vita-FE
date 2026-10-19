import type {
  AnswerFeedback,
  AnswerFeedbackResponse,
} from "@/entities/feedback/model/types";
import { requestJson } from "@/shared/api/http";

/** 사용자 답변 피드백 API */
export const feedbackApi = {
  /**
   * 답변 피드백(회원 전용, null이면 취소).
   * BE는 DISLIKE면 관리자 답변 피드백 목록에 올리고, LIKE로 바꾸거나 취소하면 내린다.
   */
  sendAnswerFeedback: (messageId: number, feedback: AnswerFeedback | null) =>
    requestJson<AnswerFeedbackResponse>(
      `/chat/messages/${messageId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ feedback }),
      },
    ),
};

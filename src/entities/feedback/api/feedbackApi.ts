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
   * comment는 아쉬워요 이유(DISLIKE일 때만). 보내지 않으면 기존 이유를 유지하고, 빈 문자열이면 지운다.
   */
  sendAnswerFeedback: (
    messageId: number,
    feedback: AnswerFeedback | null,
    comment?: string,
  ) =>
    requestJson<AnswerFeedbackResponse>(
      `/chat/messages/${messageId}/feedback`,
      {
        method: "POST",
        // comment가 undefined면 JSON에서 빠져 기존 이유가 유지된다.
        body: JSON.stringify({ feedback, comment }),
      },
    ),
};

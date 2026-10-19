// 리팩토링 기간 임시 경로입니다. 새 경로: 상담은 @/entities/chat, 답변 피드백은 @/entities/feedback
// docs/Architecture.md Migration 7단계에서 삭제합니다.
import { chatApi } from "@/entities/chat";
import { feedbackApi } from "@/entities/feedback";

export { isPermanentClaimError } from "@/entities/chat";
export type { AnswerFeedbackResponse as ChatFeedbackResponse } from "@/entities/feedback";

export const chatService = {
  ...chatApi,
  /** 답변 피드백. entities/feedback으로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  sendFeedback: feedbackApi.sendAnswerFeedback,
};

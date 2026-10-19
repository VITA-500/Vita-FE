// 답변 피드백 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
export { feedbackApi } from "@/entities/feedback/api/feedbackApi";
export { ANSWER_FEEDBACK_COMMENT_MAX_LENGTH } from "@/entities/feedback/model/types";
export {
  ADMIN_ANSWER_FEEDBACK_MAX_LIMIT,
  adminAnswerFeedbackApi,
} from "@/entities/feedback/api/admin";
export type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackDismissResponse,
  AdminAnswerFeedbackReason,
  AdminAnswerFeedbackStats,
  AnswerFeedback,
  AnswerFeedbackResponse,
} from "@/entities/feedback/model/types";

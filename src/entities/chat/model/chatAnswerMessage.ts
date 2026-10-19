import type {
  ChatAction,
  ChatFeedback,
  ChatMessage,
  ChatStoreMap,
  ChatPlan,
} from "@/entities/chat/model/types";

export const FAILED_ANSWER_MESSAGE =
  "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";

export const PENDING_ANSWER_MESSAGE =
  "아직 답변을 만들고 있어요. 잠시 후 상담 내역을 다시 열어 주세요.";

export type { ChatMessageResponse } from "@/entities/chat/api/apiTypes";
import type { ChatMessageResponse } from "@/entities/chat/api/apiTypes";

type AnswerResult = Omit<ChatMessageResponse, "plans"> & {
  feedback?: ChatFeedback | null;
  storeMap?: ChatStoreMap | null;
  actions?: readonly ChatAction[] | null;
  plans?: readonly ChatPlan[] | null;
};

export const toAssistantMessage = (response: AnswerResult): ChatMessage => {
  // BE는 답변 생성이 실패해도(FAILED) 200으로 answer: null을 준다.
  // 빈 말풍선 대신 다시 물어보라는 안내를 보여준다.
  const answer =
    response.status === "COMPLETED" ? (response.answer?.trim() ?? "") : "";
  const hasAnswer = answer.length > 0;

  return {
    id: `assistant-${response.messageId}`,
    serverMessageId: response.messageId,
    role: "assistant",
    content: hasAnswer ? answer : FAILED_ANSWER_MESSAGE,
    status: hasAnswer ? "success" : "error",
    createdAt: response.createAt,
    feedback: response.feedback ?? null,
    relatedFaqIds: hasAnswer ? response.relatedFaqIds : undefined,
    storeMap: hasAnswer ? (response.storeMap ?? undefined) : undefined,
    actions: hasAnswer ? (response.actions ?? undefined) : undefined,
    plans: hasAnswer ? (response.plans ?? undefined) : undefined,
  };
};

import type {
  ChatApiMessageStatus,
  ChatMessage,
  ChatStoreMap,
} from "@/features/chat/types";

export const FAILED_ANSWER_MESSAGE =
  "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";

export const PENDING_ANSWER_MESSAGE =
  "아직 답변을 만들고 있어요. 잠시 후 상담 내역을 다시 열어 주세요.";

export type ChatMessageResponse = {
  messageId: number;
  status: ChatApiMessageStatus;
  answer: string | null;
  relatedFaqIds: number[];
  createAt: string;
  latencyMs: number;
  storeMap?: ChatStoreMap | null;
  stores?: ChatStoreMap["stores"] | null;
  nearbyStores?: ChatStoreMap["stores"] | null;
};

export const toAssistantMessage = (
  response: ChatMessageResponse,
): ChatMessage => {
  // BE는 답변 생성이 실패해도(FAILED) 200으로 answer: null을 준다.
  // 빈 말풍선 대신 다시 물어보라는 안내를 보여준다.
  const answer =
    response.status === "COMPLETED" ? (response.answer?.trim() ?? "") : "";
  const hasAnswer = answer.length > 0;

  return {
    id: `assistant-${response.messageId}`,
    role: "assistant",
    content: hasAnswer ? answer : FAILED_ANSWER_MESSAGE,
    status: hasAnswer ? "success" : "error",
    createdAt: response.createAt,
    storeMap:
      response.storeMap ??
      (response.stores?.length
        ? { stores: response.stores }
        : response.nearbyStores?.length
          ? { stores: response.nearbyStores }
          : undefined),
  };
};

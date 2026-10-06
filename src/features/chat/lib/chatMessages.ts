import type {
  ChatMessage,
  ChatStoreMap,
  SessionMessage,
} from "@/features/chat/types";
import { FAILED_ANSWER_MESSAGE } from "@/features/chat/lib/chatService";
import {
  createChatStoreMap,
  isStoreRelatedPrompt,
} from "@/features/chat/lib/chatStoreMap";
import { routes } from "@/shared/constants/routes";

export const toChatTitle = (prompt: string) =>
  prompt.length > 18 ? `${prompt.slice(0, 18)}...` : prompt;

export { isStoreRelatedPrompt };

export const toChatMessage = (message: SessionMessage): ChatMessage => {
  const isUser = message.role === "USER";

  return {
    id: `${isUser ? "user" : "assistant"}-${message.messageId}`,
    role: isUser ? "user" : "assistant",
    content: message.content ?? (isUser ? "" : FAILED_ANSWER_MESSAGE),
    createdAt: message.createdAt,
  };
};

export const createStoreGuideMessage = (
  storeMap?: ChatStoreMap,
): ChatMessage => ({
  id: `assistant-${Date.now()}`,
  role: "assistant",
  content:
    storeMap && storeMap.stores.length > 0
      ? "가까운 매장을 지도에 표시했어요. 최대 5곳까지 가까운 순서로 확인할 수 있고, 카드를 누르면 지도 핀도 함께 바뀝니다."
      : "가까운 매장은 매장 지도에서 위치 기준으로 확인할 수 있어요. 위치 권한을 허용하면 가까운 매장부터 정렬해서 보여드릴게요.",
  createdAt: new Date().toISOString(),
  storeMap,
  actions: [
    {
      label: "가까운 매장 보기",
      href: `${routes.chat}?mode=store`,
    },
  ],
});

export const createFallbackAssistantMessage = async (
  prompt: string,
): Promise<ChatMessage> => {
  if (isStoreRelatedPrompt(prompt)) {
    const storeMap = await createChatStoreMap(prompt).catch(() => undefined);

    return createStoreGuideMessage(storeMap);
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "일시적으로 상담 응답을 불러오지 못했어요. 잠시 후 다시 질문해 주세요.",
    createdAt: new Date().toISOString(),
  };
};

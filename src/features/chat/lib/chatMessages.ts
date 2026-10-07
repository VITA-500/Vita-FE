import type {
  ChatMessage,
  ChatStoreMap,
  SessionMessage,
} from "@/features/chat/types";
import {
  FAILED_ANSWER_MESSAGE,
  PENDING_ANSWER_MESSAGE,
} from "@/features/chat/lib/chatService";
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
  // 답변 생성 중에 화면을 떠났다가 기록을 열면 아직 PENDING일 수 있다.
  const isAnswerPending =
    !isUser && (message.status === "PENDING" || message.status === "RETRYING");

  const isAnswerFailed =
    !isUser &&
    !isAnswerPending &&
    (message.status === "FAILED" || !message.content?.trim());

  return {
    id: `${isUser ? "user" : "assistant"}-${message.messageId}`,
    role: isUser ? "user" : "assistant",
    content: isAnswerPending
      ? PENDING_ANSWER_MESSAGE
      : isAnswerFailed
        ? FAILED_ANSWER_MESSAGE
        : (message.content ?? ""),
    createdAt: message.createdAt,
    ...(isUser
      ? {}
      : {
          status: isAnswerPending
            ? ("pending" as const)
            : isAnswerFailed
              ? ("error" as const)
              : ("success" as const),
        }),
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
  status: "success",
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
    status: "error",
    createdAt: new Date().toISOString(),
  };
};

/** 사용자가 답변 생성을 중단했을 때 남기는 메시지. 그때까지 받은 글이 있으면 같이 남긴다. */
export const createStoppedAssistantMessage = (
  partialContent = "",
): ChatMessage => ({
  id: `assistant-stopped-${Date.now()}`,
  role: "assistant",
  content: partialContent.trim(),
  status: "stopped",
  createdAt: new Date().toISOString(),
});

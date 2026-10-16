import type { ChatMessage, SessionMessage } from "@/features/chat/types";
import {
  FAILED_ANSWER_MESSAGE,
  PENDING_ANSWER_MESSAGE,
} from "@/features/chat/lib/chatAnswerMessage";
import { isStoreRelatedPrompt } from "@/features/chat/lib/chatStoreMap";
import { toChatPlan, toChatStoreMap } from "./chatResponseAdapters";
import { toSafeTitleText } from "@/features/chat/lib/chatTitleMask";

export const toChatTitle = (prompt: string) => {
  const title = toSafeTitleText(prompt);

  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
};

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
          serverMessageId: message.messageId,
          feedback: message.feedback ?? null,
          status: isAnswerPending
            ? ("pending" as const)
            : isAnswerFailed
              ? ("error" as const)
              : ("success" as const),
          ...(message.storeMap
            ? { storeMap: toChatStoreMap(message.storeMap) }
            : {}),
          ...(message.plans?.length
            ? { plans: message.plans.map(toChatPlan) }
            : {}),
          ...(message.actions ? { actions: message.actions } : {}),
        }),
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

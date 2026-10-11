import type { ChatMessage } from "@/features/chat/types";

export const findUserMessageBeforeAssistant = (
  messages: readonly ChatMessage[],
  assistantMessageId: string,
) => {
  const assistantIndex = messages.findIndex(
    ({ id }) => id === assistantMessageId,
  );

  if (assistantIndex < 0) {
    return undefined;
  }

  return messages
    .slice(0, assistantIndex)
    .reverse()
    .find((message) => message.role === "user");
};

export const getLastUserMessage = (messages: readonly ChatMessage[]) =>
  [...messages].reverse().find((message) => message.role === "user");

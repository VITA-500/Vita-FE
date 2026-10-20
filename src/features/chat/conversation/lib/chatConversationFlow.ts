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

const isRetryableAnswer = (message: ChatMessage | undefined) =>
  message?.role === "assistant" &&
  (message.status === "error" || message.status === "stopped");

const isSamePrompt = (a: ChatMessage | undefined, b: string) =>
  a?.role === "user" && a.content.trim() === b.trim();

/**
 * 같은 질문을 다시 보내기 전에, 끝에 연달아 남은 "같은 질문 + 실패·중단 답변" 시도를 모두 지운다.
 * BE가 이전 시도를 대체 처리(replacesMessageId)하기 전까지 화면에 같은 실패가 쌓이지 않게 하는 용도.
 */
export const dropTrailingFailedAttempts = (
  messages: readonly ChatMessage[],
  prompt: string,
) => {
  let end = messages.length;

  while (
    end >= 2 &&
    isRetryableAnswer(messages[end - 1]) &&
    isSamePrompt(messages[end - 2], prompt)
  ) {
    end -= 2;
  }

  return messages.slice(0, end);
};

/**
 * 서버 기록에서 "질문 + 실패 답변" 바로 뒤에 같은 질문이 다시 이어지면 앞의 실패 시도를 숨긴다.
 * BE는 다시 시도할 때마다 질문과 실패 답변을 모두 저장하므로, 화면에는 마지막 시도만 남긴다.
 */
export const collapseRetriedFailures = (messages: readonly ChatMessage[]) =>
  messages.filter((message, index) => {
    const isFailedPairStart =
      message.role === "user" &&
      messages[index + 1]?.role === "assistant" &&
      messages[index + 1]?.status === "error" &&
      isSamePrompt(messages[index + 2], message.content);
    const isFailedPairEnd =
      message.role === "assistant" &&
      message.status === "error" &&
      messages[index - 1]?.role === "user" &&
      isSamePrompt(messages[index + 1], messages[index - 1].content);

    return !isFailedPairStart && !isFailedPairEnd;
  });

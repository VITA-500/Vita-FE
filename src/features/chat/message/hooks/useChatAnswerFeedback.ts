"use client";

import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { canSendAnswerFeedback } from "@/features/chat/message/lib/chatAnswerFeedback";
import { chatService } from "@/features/chat/lib/chatService";
import type { ChatFeedback, ChatMessage } from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/providers/ToastProvider";

type SendFeedbackOptions = {
  /** true면 실패 토스트를 띄우지 않는다. 호출하는 쪽이 결과를 한 번에 안내할 때 쓴다. */
  silent?: boolean;
  /** 아쉬워요 이유. 있으면 같은 값을 다시 눌러도 취소하지 않고 이유와 함께 아쉬워요로 저장한다. */
  comment?: string;
};

type UseChatAnswerFeedbackParams = {
  isAuthenticated: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
};

export const useChatAnswerFeedback = ({
  isAuthenticated,
  messages,
  setMessages,
}: UseChatAnswerFeedbackParams) => {
  const [feedbackMessageIds, setFeedbackMessageIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const sendAnswerFeedback = useCallback(
    async (
      assistantMessageId: string,
      feedback: ChatFeedback,
      { comment, silent = false }: SendFeedbackOptions = {},
    ): Promise<ChatFeedback | null | undefined> => {
      const target = messages.find(
        (message) => message.id === assistantMessageId,
      );

      if (
        !target ||
        !canSendAnswerFeedback(target) ||
        !target.serverMessageId ||
        feedbackMessageIds.has(assistantMessageId)
      ) {
        return undefined;
      }

      // 답변 피드백은 회원 전용이다. 비로그인 화면에는 버튼이 없지만, 호출돼도 보내지 않는다.
      if (!isAuthenticated) {
        return undefined;
      }

      const nextFeedback =
        comment !== undefined || target.feedback !== feedback ? feedback : null;
      setFeedbackMessageIds((ids) => new Set(ids).add(assistantMessageId));

      try {
        const response = await chatService.sendFeedback(
          target.serverMessageId,
          nextFeedback,
          comment,
        );

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, feedback: response.feedback }
              : message,
          ),
        );
        return response.feedback;
      } catch (error) {
        if (silent) return undefined;

        const status = error instanceof ApiError ? error.status : undefined;

        showToast(
          status === 400
            ? "피드백 형식이 맞지 않아요. 잠시 후 다시 시도해 주세요."
            : status === 401
              ? "로그인 상태를 확인한 뒤 다시 눌러 주세요."
              : "피드백을 반영하지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
        return undefined;
      } finally {
        setFeedbackMessageIds((ids) => {
          const nextIds = new Set(ids);
          nextIds.delete(assistantMessageId);
          return nextIds;
        });
      }
    },
    [feedbackMessageIds, isAuthenticated, messages, setMessages],
  );

  return { feedbackMessageIds, sendAnswerFeedback };
};

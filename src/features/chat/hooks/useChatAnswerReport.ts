"use client";

import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { canReportAnswer } from "@/features/chat/lib/chatAnswerReport";
import { chatService } from "@/features/chat/lib/chatService";
import type { ChatMessage } from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/ui/ToastProvider";

type ReportAnswerOptions = {
  /** true면 토스트를 띄우지 않는다. 호출하는 쪽이 결과를 한 번에 안내할 때 쓴다. */
  silent?: boolean;
};

type UseChatAnswerReportParams = {
  isAuthenticated: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
};

export const useChatAnswerReport = ({
  isAuthenticated,
  messages,
  setMessages,
}: UseChatAnswerReportParams) => {
  const [reportingMessageIds, setReportingMessageIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const reportAnswerToAdmin = useCallback(
    async (
      assistantMessageId: string,
      { silent = false }: ReportAnswerOptions = {},
    ): Promise<boolean> => {
      const target = messages.find(
        (message) => message.id === assistantMessageId,
      );

      if (
        !target ||
        !canReportAnswer(target) ||
        target.reportedAt ||
        reportingMessageIds.has(assistantMessageId)
      ) {
        return false;
      }

      if (!isAuthenticated) {
        if (!silent) {
          showToast("로그인하면 이 답변을 관리자에게 보낼 수 있어요.");
        }
        return false;
      }

      setReportingMessageIds((ids) => new Set(ids).add(assistantMessageId));

      try {
        const { reportedAt } = await chatService.reportToAdmin(
          target.serverMessageId as number,
        );

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, reportedAt }
              : message,
          ),
        );
        if (!silent) {
          showToast("관리자에게 보냈어요. 답변을 보완하는 데 참고할게요.");
        }
        return true;
      } catch (error) {
        if (silent) return false;

        const status = error instanceof ApiError ? error.status : undefined;

        showToast(
          status === 401
            ? "로그인이 필요해요. 다시 로그인한 뒤 보내 주세요."
            : status === 403 || status === 404
              ? "이 답변은 관리자에게 보낼 수 없어요."
              : "관리자에게 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
        return false;
      } finally {
        setReportingMessageIds((ids) => {
          const nextIds = new Set(ids);
          nextIds.delete(assistantMessageId);
          return nextIds;
        });
      }
    },
    [isAuthenticated, messages, reportingMessageIds, setMessages],
  );

  return { reportAnswerToAdmin, reportingMessageIds };
};

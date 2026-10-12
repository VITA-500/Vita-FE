"use client";

import type { ReactNode } from "react";
import {
  AssistantProfile,
  ErrorAnswer,
  LoadingAnswer,
  PendingAnswer,
  StoppedAnswer,
  StreamingAnswer,
} from "@/features/chat/components/ChatAssistantMessageParts";
import { ChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { ChatStoreMap } from "@/features/chat/components/ChatStoreMap";
import { UserMessageBubble } from "@/features/chat/components/UserMessageBubble";
import { stripStoreTablesFromAnswer } from "@/features/chat/lib/chatStoreAnswerContent";
import type { ChatMessage, ChatStreamingReply } from "@/features/chat/types";
import { ButtonLink } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

type ChatMessageListProps = {
  /** 답변을 중단한 직후 "질문 수정" 툴팁을 자동으로 띄울 질문 메시지 id */
  editHintMessageId?: string | null;
  isLoading: boolean;
  messages: ChatMessage[];
  /** 중단된 질문을 고쳐서 다시 답변을 요청한다. */
  onEditPrompt?: (userMessageId: string, prompt: string) => void;
  /** 실패한 답변을 같은 질문으로 다시 요청한다. */
  onRetryAnswer?: (assistantMessageId: string) => void;
  /** SSE로 받고 있는 답변. 글자가 오기 시작하면 진행 단계 대신 답변 말풍선을 바로 보여준다. */
  streamingReply?: ChatStreamingReply | null;
};

const AssistantRow = ({
  children,
  hasStoreMap,
}: {
  children: ReactNode;
  hasStoreMap?: boolean;
}) => (
  <div
    className={cn(
      "mr-auto flex max-w-full items-start gap-2 md:gap-3",
      hasStoreMap ? "md:max-w-[92%]" : "md:max-w-[76%]",
    )}
  >
    <AssistantProfile />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

const AssistantBubble = ({ children }: { children: ReactNode }) => (
  <article className="border-border text-text-primary rounded-3xl border bg-white px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-white/10 dark:bg-zinc-950 dark:text-white">
    {children}
  </article>
);

const AssistantSuccessMessage = ({ message }: { message: ChatMessage }) => {
  const answerContent = stripStoreTablesFromAnswer(
    message.content ?? "",
    message.storeMap,
  );

  return (
    <AssistantRow hasStoreMap={Boolean(message.storeMap)}>
      <AssistantBubble>
        {answerContent && <ChatMarkdown content={answerContent} />}
        {message.storeMap && <ChatStoreMap storeMap={message.storeMap} />}

        {message.actions && message.actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <ButtonLink
                key={action.href}
                href={action.href}
                size="sm"
                className="rounded-full"
              >
                {action.label}
              </ButtonLink>
            ))}
          </div>
        )}
      </AssistantBubble>
    </AssistantRow>
  );
};

const ChatMessageItem = ({
  editHintMessageId,
  index,
  isLastMessage,
  isLoading,
  message,
  messages,
  onEditPrompt,
  onRetryAnswer,
}: {
  editHintMessageId?: string | null;
  index: number;
  isLastMessage: boolean;
  isLoading: boolean;
  message: ChatMessage;
  messages: ChatMessage[];
  onEditPrompt?: (userMessageId: string, prompt: string) => void;
  onRetryAnswer?: (assistantMessageId: string) => void;
}) => {
  if (message.role === "user") {
    const nextMessage = messages[index + 1];
    const canEdit =
      !isLoading &&
      Boolean(onEditPrompt) &&
      index === messages.length - 2 &&
      nextMessage?.status === "stopped";

    return (
      <UserMessageBubble
        canEdit={canEdit}
        content={message.content}
        showEditHint={editHintMessageId === message.id}
        onSubmitEdit={(prompt) => onEditPrompt?.(message.id, prompt)}
      />
    );
  }

  if (message.status === "error") {
    return (
      <AssistantRow>
        <ErrorAnswer
          content={message.content}
          onRetry={
            isLastMessage && !isLoading && onRetryAnswer
              ? () => onRetryAnswer(message.id)
              : undefined
          }
        />
      </AssistantRow>
    );
  }

  if (message.status === "stopped" || message.status === "pending") {
    return (
      <AssistantRow>
        {message.status === "stopped" ? (
          <StoppedAnswer content={message.content} />
        ) : (
          <PendingAnswer content={message.content} />
        )}
      </AssistantRow>
    );
  }

  return <AssistantSuccessMessage message={message} />;
};

export const ChatMessageList = ({
  editHintMessageId,
  isLoading,
  messages,
  onEditPrompt,
  onRetryAnswer,
  streamingReply,
}: ChatMessageListProps) => (
  <div className="mx-auto flex w-full flex-col gap-5">
    {messages.map((message, index) => (
      <ChatMessageItem
        key={message.id}
        editHintMessageId={editHintMessageId}
        index={index}
        isLastMessage={index === messages.length - 1}
        isLoading={isLoading}
        message={message}
        messages={messages}
        onEditPrompt={onEditPrompt}
        onRetryAnswer={onRetryAnswer}
      />
    ))}

    {isLoading &&
      streamingReply &&
      (streamingReply.content || streamingReply.isPreparingBlock) && (
        <AssistantRow>
          <AssistantBubble>
            <StreamingAnswer reply={streamingReply} />
          </AssistantBubble>
        </AssistantRow>
      )}

    {isLoading &&
      !streamingReply?.content &&
      !streamingReply?.isPreparingBlock && (
        <div
          aria-label="답변을 준비하고 있어요"
          className="mr-auto flex max-w-[76%] items-start gap-3"
        >
          <AssistantProfile />
          <LoadingAnswer stage={streamingReply?.stage} />
        </div>
      )}
  </div>
);

"use client";

import type { RefObject } from "react";
import { ChatComposer } from "@/features/chat/conversation/components/ChatComposer";
import { ChatMessageList } from "@/features/chat/message/components/ChatMessageList";
import { PromptSuggestions } from "@/features/chat/conversation/components/PromptSuggestions";
import type {
  ChatFeedback,
  ChatMessage,
  ChatStreamingReply,
} from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

type ChatConversationContentProps = {
  chatInput: string;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  chatStatus: "idle" | "loading";
  editHintMessageId?: string | null;
  hasChatStarted: boolean;
  loadingSessionId: number | null;
  messages: ChatMessage[];
  onChatInputChange: (value: string) => void;
  onEditPrompt: (userMessageId: string, prompt: string) => void;
  onFeedbackAnswer?: (
    assistantMessageId: string,
    feedback: ChatFeedback,
    comment?: string,
  ) => void;
  onRetryAnswer: (assistantMessageId: string) => void;
  /** 피드백 저장·관리자 전달 중인 답변 메시지 id. */
  feedbackMessageIds?: ReadonlySet<string>;
  onStopAnswer: () => void;
  onSubmitPrompt: (prompt?: string) => void;
  onSelectQuickAction: (prompt: string) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  streamingReply?: ChatStreamingReply | null;
};

export const ChatConversationContent = ({
  chatInput,
  chatInputRef,
  chatStatus,
  editHintMessageId,
  hasChatStarted,
  loadingSessionId,
  messages,
  onChatInputChange,
  onEditPrompt,
  onFeedbackAnswer,
  onRetryAnswer,
  onSelectQuickAction,
  feedbackMessageIds,
  onStopAnswer,
  onSubmitPrompt,
  scrollContainerRef,
  streamingReply,
}: ChatConversationContentProps) => (
  <div className="relative min-h-0 flex-1">
    {hasChatStarted ? (
      <>
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[860px] px-6 pt-16 pb-36 md:pt-20">
            <div
              aria-busy={loadingSessionId !== null}
              className={cn(
                "transition-opacity duration-200",
                loadingSessionId !== null && "opacity-40",
              )}
            >
              <ChatMessageList
                editHintMessageId={editHintMessageId}
                isLoading={chatStatus === "loading"}
                messages={messages}
                onEditPrompt={onEditPrompt}
                onFeedbackAnswer={onFeedbackAnswer}
                onRetryAnswer={onRetryAnswer}
                feedbackMessageIds={feedbackMessageIds}
                streamingReply={streamingReply}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-warm/95 pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pt-4 pb-6 backdrop-blur">
          <div className="pointer-events-auto mx-auto w-full max-w-[860px]">
            <ChatComposer
              inputRef={chatInputRef}
              isLoading={chatStatus === "loading"}
              value={chatInput}
              onChange={onChatInputChange}
              onStop={onStopAnswer}
              onSelectQuickAction={onSelectQuickAction}
              onSubmit={() => onSubmitPrompt()}
            />
          </div>
        </div>
      </>
    ) : (
      <div className="mx-auto flex h-full w-full max-w-[860px] flex-col justify-center px-6 pt-16 pb-10">
        <div className="pb-8">
          <h1 className="text-text-primary mb-3 text-center text-3xl font-semibold tracking-normal dark:text-white">
            무엇을 도와드릴까요?
          </h1>

          <p className="text-text-secondary text-center text-sm font-normal dark:text-gray-400">
            통신 서비스에 대해 궁금한 내용을 편하게 물어보세요.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[760px]">
          <ChatComposer
            inputRef={chatInputRef}
            isLoading={chatStatus === "loading"}
            value={chatInput}
            onChange={onChatInputChange}
            onStop={onStopAnswer}
            onSelectQuickAction={onSelectQuickAction}
            onSubmit={() => onSubmitPrompt()}
          />
        </div>

        <PromptSuggestions
          onSelectPrompt={(prompt) => onSubmitPrompt(prompt)}
        />
      </div>
    )}
  </div>
);

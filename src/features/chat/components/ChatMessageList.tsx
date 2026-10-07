"use client";

import Image from "next/image";
import {
  ArrowUp,
  CircleAlert,
  CircleStop,
  Clock3,
  Pencil,
  RotateCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { ChatProgressSteps } from "@/features/chat/components/ChatProgressSteps";
import { ChatStoreMap } from "@/features/chat/components/ChatStoreMap";
import type { ChatMessage, ChatStreamingReply } from "@/features/chat/types";
import { ButtonLink } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

const ASSISTANT_PROFILE_IMAGE = "/images/chatbot/profile-robot.png";

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

const AssistantProfile = () => (
  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fffbdc]">
    <Image
      src={ASSISTANT_PROFILE_IMAGE}
      alt="VITA 상담사"
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
    />
  </span>
);

/** 덜 온 굵게(**)·코드(`) 표시가 기호 그대로 보이지 않도록 마지막 줄의 짝을 맞춰 준다. */
const closeOpenInlineMarks = (content: string) => {
  const lastLine = content.slice(content.lastIndexOf("\n") + 1);
  const boldCount = lastLine.match(/\*\*/g)?.length ?? 0;
  const codeCount = lastLine.match(/`/g)?.length ?? 0;
  let closed = content;

  if (codeCount % 2 === 1) closed += "`";
  if (boldCount % 2 === 1) closed += "**";

  return closed;
};

/** 목록·표·카드를 받는 동안 말풍선 안에 보여주는 자리 표시 블록 */
const PreparingBlock = () => (
  <div
    role="status"
    aria-label="내용을 정리하고 있어요"
    className="border-border bg-surface-muted/60 mt-3 space-y-2.5 rounded-2xl border p-4 first:mt-0 dark:border-white/10 dark:bg-white/5"
  >
    <span className="block h-3 w-1/3 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
    <span className="block h-3 w-11/12 animate-pulse rounded-full bg-gray-200 [animation-delay:120ms] dark:bg-white/10" />
    <span className="block h-3 w-4/5 animate-pulse rounded-full bg-gray-200 [animation-delay:240ms] dark:bg-white/10" />
  </div>
);

/**
 * 스트리밍 중인 답변. 글은 한 글자씩 늘어나고, 목록·표·카드는 받는 동안 로딩 블록을 보여주다가
 * 완성되면 통째로 나타난다(chat-stream-blocks: 새로 붙는 블록만 페이드인).
 */
const StreamingAnswer = ({ reply }: { reply: ChatStreamingReply }) => (
  <>
    {reply.content.trim() && (
      <ChatMarkdown
        content={closeOpenInlineMarks(reply.content)}
        className="chat-stream-blocks"
      />
    )}
    {reply.isPreparingBlock && <PreparingBlock />}
  </>
);

/** 답변 실패: 붉은 톤 블록 + (마지막 답변이면) 다시 시도 버튼 */
const ErrorAnswer = ({
  content,
  onRetry,
}: {
  content: string;
  onRetry?: () => void;
}) => (
  <article
    role="alert"
    className="rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-red-500/25 dark:bg-red-500/10"
  >
    <div className="flex gap-2.5">
      <CircleAlert
        size={18}
        className="mt-0.5 shrink-0 text-red-500 dark:text-red-300"
      />
      <div className="min-w-0">
        <p className="font-extrabold text-red-700 dark:text-red-200">
          답변을 받지 못했어요
        </p>
        <p className="text-red-600/90 dark:text-red-200/80">{content}</p>
      </div>
    </div>

    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 ml-[26px] inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/15"
      >
        <RotateCw size={13} />
        다시 시도
      </button>
    )}
  </article>
);

/** 사용자가 중단한 답변: 받은 데까지의 글 + 중단 표시 */
const StoppedAnswer = ({ content }: { content: string }) => (
  <article className="border-border text-text-primary rounded-3xl border border-dashed bg-white/70 px-4 py-4 text-sm leading-6 md:px-5 dark:border-white/15 dark:bg-zinc-950/70 dark:text-white">
    {content && (
      <div className="opacity-70">
        <ChatMarkdown content={closeOpenInlineMarks(content)} />
      </div>
    )}
    <p
      className={cn(
        "text-text-secondary flex items-center gap-1.5 text-xs font-bold dark:text-gray-400",
        content && "border-border mt-3 border-t pt-3 dark:border-white/10",
      )}
    >
      <CircleStop size={14} />
      답변 생성을 중단했어요. 질문을 수정해서 다시 물어볼 수 있어요.
    </p>
  </article>
);

/** 기록을 열었는데 BE가 아직 답변을 만드는 중 */
const PendingAnswer = ({ content }: { content: string }) => (
  <article
    role="status"
    className="border-brand/30 bg-brand-soft/60 text-text-primary flex gap-2.5 rounded-3xl border px-4 py-4 text-sm leading-6 md:px-5 dark:border-white/10 dark:bg-white/5 dark:text-white"
  >
    <Clock3 size={18} className="text-brand mt-0.5 shrink-0" />
    <p>{content}</p>
  </article>
);

type UserMessageBubbleProps = {
  canEdit: boolean;
  content: string;
  showEditHint: boolean;
  onSubmitEdit: (prompt: string) => void;
};

/** 질문 말풍선. 중단된 질문이면 왼쪽에 펜 버튼이 붙고, 누르면 그 자리에서 고쳐 다시 보낼 수 있다. */
const UserMessageBubble = ({
  canEdit,
  content,
  onSubmitEdit,
  showEditHint,
}: UserMessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;

    const textarea = textareaRef.current;

    textarea?.focus();
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [isEditing]);

  // 다른 답변이 시작되는 등으로 수정할 수 없게 되면 편집을 닫는다.
  const isEditOpen = isEditing && canEdit;

  const startEdit = () => {
    setDraft(content);
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const submitEdit = () => {
    const nextPrompt = draft.trim();

    if (!nextPrompt) return;

    setIsEditing(false);
    onSubmitEdit(nextPrompt);
  };

  if (isEditOpen) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitEdit();
        }}
        className="border-brand ml-auto w-full max-w-[72%] rounded-2xl border-2 bg-white p-3 shadow-sm dark:bg-zinc-950"
      >
        <label className="sr-only" htmlFor="chat-edit-prompt">
          질문 수정
        </label>
        <textarea
          id="chat-edit-prompt"
          ref={textareaRef}
          value={draft}
          rows={Math.min(Math.max(draft.split("\n").length, 2), 6)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            }

            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submitEdit();
            }
          }}
          className="text-text-primary w-full resize-none bg-transparent px-1 text-sm leading-6 outline-none dark:text-white"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            className="text-text-secondary hover:bg-surface-muted rounded-full px-3 py-1.5 text-xs font-bold transition dark:text-gray-300 dark:hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="submit"
            aria-label="다시 보내기"
            title="다시 보내기"
            disabled={!draft.trim()}
            className="bg-brand hover:bg-brand-hover flex h-8 w-8 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="ml-auto flex max-w-[72%] flex-col items-end gap-1.5">
      <article className="border-brand/40 bg-brand min-w-0 rounded-2xl border px-5 py-3 text-sm leading-6 text-white shadow-sm">
        <p className="whitespace-pre-line">{content}</p>
      </article>

      {/* 중단된 질문: 말풍선 우측 하단에 펜 버튼, 툴팁은 펜 왼쪽에 뜬다. */}
      {canEdit && (
        <div className="group relative">
          <button
            type="button"
            aria-label="질문 수정"
            onClick={startEdit}
            className="text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-brand flex h-8 w-8 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Pencil size={15} />
          </button>
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white shadow-lg transition-opacity duration-200",
              "after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-900",
              showEditHint
                ? "opacity-100"
                : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            질문 수정
          </span>
        </div>
      )}
    </div>
  );
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
    {messages.map((message, index) => {
      const isUser = message.role === "user";
      const isLastMessage = index === messages.length - 1;

      if (isUser) {
        // 마지막 답변이 중단된 질문만 고쳐서 다시 물을 수 있다(앞쪽 대화가 지워지지 않도록).
        const nextMessage = messages[index + 1];
        const canEdit =
          !isLoading &&
          Boolean(onEditPrompt) &&
          index === messages.length - 2 &&
          nextMessage?.status === "stopped";

        return (
          <UserMessageBubble
            key={message.id}
            canEdit={canEdit}
            content={message.content}
            showEditHint={editHintMessageId === message.id}
            onSubmitEdit={(prompt) => onEditPrompt?.(message.id, prompt)}
          />
        );
      }

      if (message.status === "error") {
        return (
          <div
            key={message.id}
            className="mr-auto flex max-w-full items-start gap-2 md:max-w-[76%] md:gap-3"
          >
            <AssistantProfile />
            <div className="min-w-0 flex-1">
              <ErrorAnswer
                content={message.content}
                onRetry={
                  isLastMessage && !isLoading && onRetryAnswer
                    ? () => onRetryAnswer(message.id)
                    : undefined
                }
              />
            </div>
          </div>
        );
      }

      if (message.status === "stopped" || message.status === "pending") {
        return (
          <div
            key={message.id}
            className="mr-auto flex max-w-full items-start gap-2 md:max-w-[76%] md:gap-3"
          >
            <AssistantProfile />
            <div className="min-w-0 flex-1">
              {message.status === "stopped" ? (
                <StoppedAnswer content={message.content} />
              ) : (
                <PendingAnswer content={message.content} />
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={message.id}
          className={cn(
            "mr-auto flex max-w-full items-start gap-2 md:gap-3",
            message.storeMap ? "md:max-w-[92%]" : "md:max-w-[76%]",
          )}
        >
          <AssistantProfile />

          <div className="min-w-0 flex-1">
            <article className="border-border text-text-primary rounded-3xl border bg-white px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-white/10 dark:bg-zinc-950 dark:text-white">
              <ChatMarkdown content={message.content ?? ""} />

              {message.storeMap && <ChatStoreMap storeMap={message.storeMap} />}

              {/* 참고한 FAQ 표시는 사용하지 않기로 해서 숨김 처리 (BE relatedFaqs 미요청).
                  다시 표시하려면 아래 블록의 주석을 해제하세요.
              {message.sources && message.sources.length > 0 && (
                <div className="border-border mt-4 space-y-2 border-t pt-3 dark:border-white/10">
                  <p className="text-brand text-xs font-extrabold">
                    참고한 FAQ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <span
                        key={source.id}
                        className="bg-surface-muted text-text-secondary rounded-full px-3 py-1 text-xs font-bold dark:bg-white/10 dark:text-gray-300"
                      >
                        {source.category} · {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              */}

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
            </article>
          </div>
        </div>
      );
    })}

    {isLoading &&
      streamingReply &&
      (streamingReply.content || streamingReply.isPreparingBlock) && (
        <div
          aria-busy="true"
          className="mr-auto flex max-w-full items-start gap-2 md:max-w-[76%] md:gap-3"
        >
          <AssistantProfile />

          <div className="min-w-0 flex-1">
            <article className="border-border text-text-primary rounded-3xl border bg-white px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-white/10 dark:bg-zinc-950 dark:text-white">
              <StreamingAnswer reply={streamingReply} />
            </article>
          </div>
        </div>
      )}

    {isLoading &&
      !streamingReply?.content &&
      !streamingReply?.isPreparingBlock && (
        <div
          aria-label="답변을 준비하고 있어요"
          className="mr-auto flex max-w-[76%] items-start gap-3"
        >
          <AssistantProfile />

          <div className="min-w-0">
            <ChatProgressSteps stage={streamingReply?.stage} />

            {/* 기존 로딩 표시: 단계 아래에서 계속 움직여 응답을 기다리는 중임을 보여준다. */}
            <div
              aria-hidden="true"
              className="text-text-secondary mt-3 flex items-center gap-2 pl-7 text-sm font-medium dark:text-gray-400"
            >
              <span className="animate-pulse">생각 중</span>
              <span className="flex items-center gap-1 pt-1">
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:120ms]" />
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        </div>
      )}
  </div>
);

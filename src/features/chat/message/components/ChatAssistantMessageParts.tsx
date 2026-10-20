"use client";

import Image from "next/image";
import { CircleAlert, CircleStop, Clock3, RotateCw } from "lucide-react";
import { ChatMarkdown } from "@/features/chat/message/components/ChatMarkdown";
import {
  answerRecoveryLabels,
  ChatProgressSteps,
} from "@/features/chat/message/components/ChatProgressSteps";
import type {
  ChatAnswerRecovery,
  ChatProgressStage,
  ChatStreamingReply,
} from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

const ASSISTANT_PROFILE_IMAGE = "/images/chatbot/profile-robot.png";

export const AssistantProfile = () => (
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

const closeOpenInlineMarks = (content: string) => {
  const lastLine = content.slice(content.lastIndexOf("\n") + 1);
  const boldCount = lastLine.match(/\*\*/g)?.length ?? 0;
  const codeCount = lastLine.match(/`/g)?.length ?? 0;
  let closed = content;

  if (codeCount % 2 === 1) closed += "`";
  if (boldCount % 2 === 1) closed += "**";

  return closed;
};

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

export const StreamingAnswer = ({ reply }: { reply: ChatStreamingReply }) => (
  <>
    {reply.content.trim() && (
      <ChatMarkdown
        content={closeOpenInlineMarks(reply.content)}
        className="chat-stream-blocks"
      />
    )}
    {reply.isPreparingBlock && <PreparingBlock />}
    {reply.recovery && (
      <p
        role="status"
        className="text-text-secondary mt-2 flex items-center gap-1.5 text-xs font-medium dark:text-gray-400"
      >
        <RotateCw
          size={12}
          className="text-brand animate-spin"
          aria-hidden="true"
        />
        {answerRecoveryLabels[reply.recovery]}
      </p>
    )}
  </>
);

export const ErrorAnswer = ({
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

export const StoppedAnswer = ({
  content,
  onRetry,
}: {
  content: string;
  onRetry?: () => void;
}) => (
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
      답변 생성을 중단했어요. 같은 질문을 다시 보내거나 수정할 수 있어요.
    </p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="border-border text-text-secondary mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:bg-gray-100 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/10"
      >
        <RotateCw size={13} aria-hidden="true" />
        다시 보내기
      </button>
    )}
  </article>
);

export const PendingAnswer = ({ content }: { content: string }) => (
  <article
    role="status"
    className="border-brand/30 bg-brand-soft/60 text-text-primary flex gap-2.5 rounded-3xl border px-4 py-4 text-sm leading-6 md:px-5 dark:border-white/10 dark:bg-white/5 dark:text-white"
  >
    <Clock3 size={18} className="text-brand mt-0.5 shrink-0" />
    <p>{content}</p>
  </article>
);

export const LoadingAnswer = ({
  recovery,
  stage,
}: {
  recovery?: ChatAnswerRecovery;
  stage?: ChatProgressStage;
}) => (
  <div className="min-w-0">
    <ChatProgressSteps stage={stage} recovery={recovery} />
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
);

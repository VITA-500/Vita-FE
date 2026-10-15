"use client";

import type { ReactNode } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { ChatFeedback, ChatMessage } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

type ChatAnswerFeedbackProps = {
  isFeedbackSubmitting?: boolean;
  message: ChatMessage;
  onFeedback: (feedback: ChatFeedback) => void;
};

/**
 * 답변 아래 "도움이 되었나요?" 피드백.
 * 회원에게만 보인다. "아쉬워요"를 저장하면 BE가 피드백 API 안에서 관리자 답변 피드백 목록에 올리고,
 * "좋아요"로 바꾸거나 취소하면 내린다. FE는 피드백만 보낸다(useChatConversationController).
 */
export const ChatAnswerFeedback = ({
  isFeedbackSubmitting = false,
  message,
  onFeedback,
}: ChatAnswerFeedbackProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mt-3 inline-flex max-w-full flex-col items-start px-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="px-1 text-xs font-bold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        도움이 되었나요?
      </button>
      {isOpen && (
        <div className="absolute top-full left-1 z-20 flex min-w-28 flex-col items-stretch gap-1 rounded-xl bg-white p-1 shadow-lg ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-white/10">
          <FeedbackButton
            feedback="LIKE"
            icon={<ThumbsUp size={13} aria-hidden="true" />}
            isActive={message.feedback === "LIKE"}
            isDisabled={isFeedbackSubmitting}
            label="좋아요"
            onClick={onFeedback}
          />
          <FeedbackButton
            feedback="DISLIKE"
            icon={<ThumbsDown size={13} aria-hidden="true" />}
            isActive={message.feedback === "DISLIKE"}
            isDisabled={isFeedbackSubmitting}
            label="아쉬워요"
            onClick={onFeedback}
          />
        </div>
      )}
    </div>
  );
};

const FeedbackButton = ({
  feedback,
  icon,
  isActive,
  isDisabled,
  label,
  onClick,
}: {
  feedback: ChatFeedback;
  icon: ReactNode;
  isActive: boolean;
  isDisabled: boolean;
  label: string;
  onClick: (feedback: ChatFeedback) => void;
}) => (
  <button
    type="button"
    aria-pressed={isActive}
    className={cn(
      "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
      isActive
        ? "border-brand bg-brand-soft text-brand"
        : "border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200",
    )}
    disabled={isDisabled}
    onClick={() => onClick(feedback)}
  >
    {icon}
    {label}
  </button>
);

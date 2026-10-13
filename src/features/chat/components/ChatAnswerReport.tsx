"use client";

import type { ReactNode } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { ChatFeedback, ChatMessage } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

type ChatAnswerReportProps = {
  isFeedbackSubmitting?: boolean;
  message: ChatMessage;
  onFeedback: (feedback: ChatFeedback) => void;
};

/**
 * 답변 아래 "도움이 되었나요?" 피드백.
 * "아쉬워요"를 누르면 피드백 저장과 함께 관리자에게 바로 전달된다(useChatConversationController).
 */
export const ChatAnswerReport = ({
  isFeedbackSubmitting = false,
  message,
  onFeedback,
}: ChatAnswerReportProps) => (
  <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
    <span className="text-xs font-bold text-gray-400">도움이 되었나요?</span>
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
);

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

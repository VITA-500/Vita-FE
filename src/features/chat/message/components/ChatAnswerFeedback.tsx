"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { ANSWER_FEEDBACK_COMMENT_MAX_LENGTH } from "@/entities/feedback";
import { cn } from "@/shared/lib/cn";
import { TextAreaField } from "@/shared/ui/atoms/TextAreaField";
import type { ChatFeedback, ChatMessage } from "@/entities/chat";

type ChatAnswerFeedbackProps = {
  isFeedbackSubmitting?: boolean;
  message: ChatMessage;
  /** comment는 아쉬워요 이유. 이유 입력 칸에서 보낼 때만 넘긴다. */
  onFeedback: (feedback: ChatFeedback, comment?: string) => void;
};

/**
 * 답변 아래 "도움이 되었나요?" 피드백.
 * 회원에게만 보인다. "아쉬워요"를 저장하면 BE가 피드백 API 안에서 관리자 답변 피드백 목록에 올리고,
 * "좋아요"로 바꾸거나 취소하면 내린다. FE는 피드백만 보낸다(useChatConversationController).
 * 아쉬워요를 새로 누르면 이유를 남길 수 있는 입력 칸을 연다(선택, 관리자 답변 피드백 목록에 함께 보인다).
 */
export const ChatAnswerFeedback = ({
  isFeedbackSubmitting = false,
  message,
  onFeedback,
}: ChatAnswerFeedbackProps) => {
  // 이번 화면에서 아쉬워요를 새로 눌렀을 때만 연다. 기록을 다시 열었을 때는 묻지 않는다.
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const trimmedReason = reason.trim();

  const handleFeedback = (feedback: ChatFeedback) => {
    const isNewDislike =
      feedback === "DISLIKE" && message.feedback !== "DISLIKE";

    setReason("");
    setIsReasonOpen(isNewDislike);
    onFeedback(feedback);
  };

  const submitReason = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedReason || isFeedbackSubmitting) return;

    onFeedback("DISLIKE", trimmedReason);
    setIsReasonOpen(false);
  };

  return (
    <div className="mt-3 max-w-full px-1">
      <div
        role="group"
        aria-label="답변 피드백"
        className="inline-flex max-w-full items-center gap-1 whitespace-nowrap"
      >
        <span className="mr-1 text-xs font-bold text-gray-500 dark:text-gray-400">
          도움이 되었나요?
        </span>
        <FeedbackButton
          feedback="LIKE"
          icon={<ThumbsUp size={13} aria-hidden="true" />}
          isActive={message.feedback === "LIKE"}
          isDisabled={isFeedbackSubmitting}
          label="좋아요"
          onClick={handleFeedback}
        />
        <FeedbackButton
          feedback="DISLIKE"
          icon={<ThumbsDown size={13} aria-hidden="true" />}
          isActive={message.feedback === "DISLIKE"}
          isDisabled={isFeedbackSubmitting}
          label="아쉬워요"
          onClick={handleFeedback}
        />
      </div>

      {/* 아쉬워요가 저장된 뒤에만 보인다(저장에 실패하면 열리지 않는다). */}
      {isReasonOpen && message.feedback === "DISLIKE" && (
        <form
          onSubmit={submitReason}
          className="border-border-soft mt-2 w-full max-w-md space-y-2 rounded-2xl border bg-white p-3 dark:border-white/10 dark:bg-zinc-950"
        >
          <TextAreaField
            id={`answer-feedback-reason-${message.id}`}
            label={
              <>
                어떤 점이 아쉬웠나요?{" "}
                <span className="text-gray-400">(선택)</span>
              </>
            }
            value={reason}
            maxLength={ANSWER_FEEDBACK_COMMENT_MAX_LENGTH}
            rows={2}
            placeholder="예: 요금제 가격이 실제와 달라요"
            onChange={(event) => setReason(event.target.value)}
            textareaClassName="min-h-0 resize-none border-gray-200 leading-5 dark:border-white/15 dark:bg-zinc-900"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-gray-400">
              {reason.length}/{ANSWER_FEEDBACK_COMMENT_MAX_LENGTH}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsReasonOpen(false)}
                className="h-8 rounded-xl px-3 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                건너뛰기
              </button>
              <button
                type="submit"
                disabled={!trimmedReason || isFeedbackSubmitting}
                className="bg-brand hover:bg-brand-hover h-8 rounded-xl px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                보내기
              </button>
            </div>
          </div>
        </form>
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

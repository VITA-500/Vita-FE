"use client";

import { ChevronDown, MessageSquareWarning } from "lucide-react";
import { useState } from "react";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import type { AnswerFeedbackListItem } from "@/features/admin/lib/answerFeedbackFilters";
import type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackReason,
} from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { formatKoreanMonthDay } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Modal } from "@/shared/ui/organisms/Modal";

const failReasonLabels: Record<AdminAnswerFeedbackReason, string> = {
  ANSWER_FAILED: "답변 실패",
  LOW_SIMILARITY: "유사도 낮음",
  NO_MATCH: "검색 결과 없음",
  DISLIKED: "아쉬워요",
};

const getFailReasonLabel = (reason: string) =>
  failReasonLabels[reason as AdminAnswerFeedbackReason] ?? reason;

/** 피드백 유형별 배지 색. 사용자가 직접 남긴 아쉬워요와 자동 감지 사유를 눈으로 구분하게 한다. */
const failReasonStyles: Record<AdminAnswerFeedbackReason, string> = {
  DISLIKED: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  NO_MATCH:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  LOW_SIMILARITY: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  ANSWER_FAILED:
    "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

const getFailReasonStyle = (reason: string) =>
  failReasonStyles[reason as AdminAnswerFeedbackReason] ??
  failReasonStyles.ANSWER_FAILED;

/** 머리글과 각 행이 같은 칸 너비를 쓰도록 맞춘다(md 이상에서만 표 형태). */
const rowGridClassName =
  "md:grid md:grid-cols-[minmax(0,1fr)_64px_104px_64px_64px] md:gap-4";

export type DismissFeedback = (
  id: number,
  options?: { onSettled?: () => void },
) => void;

type AnswerFeedbackListProps = {
  candidates: readonly AnswerFeedbackListItem[];
  /** 무시 처리 중인 항목 id */
  dismissingId?: number;
  /** 무시. 없으면 무시 버튼을 비활성으로 둔다. */
  onDismiss?: DismissFeedback;
  /** 항목이 없을 때 문구(필터 탭마다 다르게 쓴다) */
  emptyTitle?: string;
  emptyDescription?: string;
};

/** 챗봇 답변 피드백 목록. 대시보드와 답변 피드백 페이지가 함께 쓴다. */
export const AnswerFeedbackList = ({
  candidates,
  dismissingId,
  onDismiss,
  emptyTitle = "확인할 답변 피드백이 없어요.",
  emptyDescription = "챗봇이 답하지 못했거나 사용자가 아쉬워요를 누른 답변이 생기면 여기에 모여요.",
}: AnswerFeedbackListProps) => {
  const [dismissTarget, setDismissTarget] = useState<AdminAnswerFeedback>();
  const isDismissingTarget =
    dismissTarget !== undefined && dismissingId === dismissTarget.id;

  const closeDismissModal = () => {
    if (isDismissingTarget) return;
    setDismissTarget(undefined);
  };

  const confirmDismiss = () => {
    if (!dismissTarget || !onDismiss) return;
    onDismiss(dismissTarget.id, {
      onSettled: () => setDismissTarget(undefined),
    });
  };

  if (candidates.length === 0) {
    return (
      <AdminEmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <>
      <div
        className={cn(
          rowGridClassName,
          "hidden px-4 pb-2 text-xs font-bold text-gray-400 md:grid",
        )}
      >
        <span className="text-center">질문</span>
        <span>횟수</span>
        <span>피드백 유형</span>
        <span>최근 발생</span>
        <span className="text-center">{onDismiss ? "관리" : ""}</span>
      </div>
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <FeedbackRow
            key={`${candidate.id}-${candidate.question}`}
            candidate={candidate}
            isDismissing={dismissingId === candidate.id}
            onRequestDismiss={onDismiss ? setDismissTarget : undefined}
          />
        ))}
      </div>

      <Modal
        isOpen={dismissTarget !== undefined}
        onClose={closeDismissModal}
        size="sm"
        title="이 피드백을 무시할까요?"
        description="같은 질문으로 들어온 피드백(자동 감지·아쉬워요)이 모두 목록에서 내려가고, 되돌릴 수 없어요."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDismissModal}
              disabled={isDismissingTarget}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDismissingTarget}
              onClick={confirmDismiss}
            >
              무시
            </Button>
          </>
        }
      >
        {dismissTarget && (
          <div className="space-y-3">
            <p className="bg-surface-muted line-clamp-3 rounded-2xl px-4 py-3 text-sm font-bold break-words whitespace-pre-line text-gray-700 dark:bg-white/5 dark:text-gray-200">
              {dismissTarget.question}
            </p>
            <p className="text-text-secondary text-xs leading-5 font-semibold">
              같은 질문이 나중에 다시 해결되지 않으면 새 항목으로 다시 올라와요.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

const FeedbackRow = ({
  candidate,
  isDismissing,
  onRequestDismiss,
}: {
  candidate: AnswerFeedbackListItem;
  isDismissing: boolean;
  onRequestDismiss?: (candidate: AdminAnswerFeedback) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // 2026-10-18 BE부터 자동 감지만 있는 항목도 무시할 수 있다.
  const canDismiss = Boolean(onRequestDismiss);
  const answer = candidate.answer?.trim();
  const comments = candidate.comments ?? [];
  // 사유 탭에서는 그 탭에 걸린 사유를 배지로 쓰고, 가장 최근 사유가 다르면 따로 적는다.
  const badgeReasons: readonly string[] = candidate.matchedReasons?.length
    ? candidate.matchedReasons
    : [candidate.failReason];
  const isLatestReasonDifferent = !badgeReasons.includes(candidate.failReason);

  return (
    <div
      className={cn(
        rowGridClassName,
        "border-border-soft grid gap-3 rounded-2xl border px-4 py-3 md:items-center dark:border-white/10",
      )}
    >
      <div className="min-w-0">
        {/* 화살표는 질문 칸 오른쪽 끝에 고정해 질문 길이와 상관없이 행마다 같은 위치에 둔다. */}
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-6 font-extrabold break-words whitespace-pre-line text-gray-800 dark:text-gray-100",
              !isExpanded && "line-clamp-2",
            )}
          >
            {candidate.question}
          </p>
          <button
            type="button"
            className="hover:bg-surface-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition outline-none hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "답변 접기" : "답변 펼치기"}
            onClick={() => setIsExpanded((value) => !value)}
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform", isExpanded && "rotate-180")}
            />
          </button>
        </div>
        {comments.length > 0 && (
          <p className="mt-1 text-[11px] font-bold text-rose-500 dark:text-rose-300">
            아쉬운 이유 {comments.length}개
          </p>
        )}
      </div>

      {/* 모바일에서는 한 줄로 흐르고, md 이상에서는 각 항목이 표 칸에 들어간다. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:contents">
        <div className="text-brand flex h-6 items-center gap-1">
          <MessageSquareWarning size={16} />
          <span className="text-base font-black">
            {candidate.count.toLocaleString("ko-KR")}
          </span>
          <span className="text-xs font-bold text-gray-400">회</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 md:flex-col md:items-start">
          {badgeReasons.map((reason) => (
            <span
              key={reason}
              className={cn(
                "flex h-6 w-fit items-center rounded-full px-2.5 text-xs font-extrabold whitespace-nowrap",
                getFailReasonStyle(reason),
              )}
            >
              {getFailReasonLabel(reason)}
            </span>
          ))}
          {isLatestReasonDifferent && (
            <span className="text-[11px] font-bold whitespace-nowrap text-gray-400">
              최근: {getFailReasonLabel(candidate.failReason)}
            </span>
          )}
        </div>

        <span className="flex h-6 items-center text-xs font-bold whitespace-nowrap text-gray-400">
          {formatKoreanMonthDay(candidate.lastOccurredAt)}
        </span>

        <div className="ml-auto flex md:-mt-1 md:ml-0 md:justify-center">
          {canDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              isLoading={isDismissing}
              onClick={() => onRequestDismiss?.(candidate)}
            >
              무시
            </Button>
          ) : null}
        </div>
      </div>

      {/* 답변은 행 전체 너비로 펼쳐 오른쪽이 비지 않게 한다. */}
      {isExpanded && (
        <div className="bg-surface-muted flex items-start gap-2 rounded-xl px-3 py-2.5 md:col-span-full dark:bg-white/5">
          <span className="bg-brand-soft text-brand dark:bg-brand/15 shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-4 font-extrabold">
            답변
          </span>
          <p className="max-h-48 min-w-0 flex-1 overflow-y-auto text-xs leading-5 font-medium break-words whitespace-pre-line text-gray-600 dark:text-gray-300">
            {answer || "저장된 답변이 없어요."}
          </p>
        </div>
      )}
      {isExpanded && comments.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50/60 px-3 py-2.5 md:col-span-full dark:bg-rose-500/10">
          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] leading-4 font-extrabold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            이유
          </span>
          <ul className="min-w-0 flex-1 space-y-1 text-xs leading-5 font-medium break-words text-gray-600 dark:text-gray-300">
            {comments.map((comment, index) => (
              <li key={`${index}-${comment}`}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

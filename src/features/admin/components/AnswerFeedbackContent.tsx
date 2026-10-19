"use client";

import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { AnswerFeedbackList } from "@/features/admin/components/AnswerFeedbackList";
import { useDismissAnswerFeedback } from "@/features/admin/context/useAdminAnswerFeedback";
import type { AnswerFeedbackListItem } from "@/features/admin/lib/answerFeedbackFilters";
import type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackStats,
} from "@/features/admin/types";

type AnswerFeedbackContentProps = {
  error: string | null;
  isLoading: boolean;
  stats: AdminAnswerFeedbackStats | null;
  /** 보여줄 항목. 없으면 stats.candidates 전체(답변 피드백 페이지는 필터한 목록을 넘긴다). */
  candidates?: readonly AnswerFeedbackListItem[];
  /** false면 무시 버튼을 두지 않는다(대시보드는 요약만 보여준다). */
  allowDismiss?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

/** 답변 피드백 카드 본문(오류·불러오는 중·목록). 대시보드와 답변 피드백 페이지가 함께 쓴다. */
export const AnswerFeedbackContent = ({
  allowDismiss = true,
  candidates,
  emptyDescription,
  emptyTitle,
  error,
  isLoading,
  stats,
}: AnswerFeedbackContentProps) => {
  const { dismiss, dismissingId } = useDismissAnswerFeedback();

  return (
    <>
      {error && <AdminErrorBanner message={error} />}
      {isLoading ? (
        <p className="text-text-secondary py-6 text-center text-sm font-semibold">
          답변 피드백을 불러오고 있어요.
        </p>
      ) : (
        stats && (
          <AnswerFeedbackList
            candidates={candidates ?? stats.candidates}
            dismissingId={dismissingId}
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            onDismiss={allowDismiss ? dismiss : undefined}
          />
        )
      )}
    </>
  );
};

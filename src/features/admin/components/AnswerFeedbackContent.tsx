"use client";

import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { AnswerFeedbackList } from "@/features/admin/components/AnswerFeedbackList";
import { useDismissAnswerFeedback } from "@/features/admin/context/useAdminAnswerFeedback";
import type { AdminAnswerFeedbackStats } from "@/features/admin/types";

type AnswerFeedbackContentProps = {
  error: string | null;
  isLoading: boolean;
  stats: AdminAnswerFeedbackStats | null;
};

/** 답변 피드백 카드 본문(오류·불러오는 중·목록). 대시보드와 답변 피드백 페이지가 함께 쓴다. */
export const AnswerFeedbackContent = ({
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
            candidates={stats.candidates}
            dismissingId={dismissingId}
            onDismiss={dismiss}
          />
        )
      )}
    </>
  );
};

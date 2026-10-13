"use client";

import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { AdminUnresolvedQuestionList } from "@/features/admin/components/AdminUnresolvedQuestionList";
import { useDismissUnresolvedQuestion } from "@/features/admin/context/useAdminChatStats";
import type { AdminChatStats } from "@/features/admin/types";

type AdminChatFeedbackContentProps = {
  error: string | null;
  isLoading: boolean;
  stats: AdminChatStats | null;
};

/** 답변 피드백 카드 본문(오류·불러오는 중·목록). 대시보드와 답변 피드백 페이지가 함께 쓴다. */
export const AdminChatFeedbackContent = ({
  error,
  isLoading,
  stats,
}: AdminChatFeedbackContentProps) => {
  const { dismiss, dismissingId } = useDismissUnresolvedQuestion();

  return (
    <>
      {error && <AdminErrorBanner message={error} />}
      {isLoading ? (
        <p className="text-text-secondary py-6 text-center text-sm font-semibold">
          답변 피드백을 불러오고 있어요.
        </p>
      ) : (
        stats && (
          <AdminUnresolvedQuestionList
            candidates={stats.candidates}
            dismissingId={dismissingId}
            onDismiss={dismiss}
          />
        )
      )}
    </>
  );
};

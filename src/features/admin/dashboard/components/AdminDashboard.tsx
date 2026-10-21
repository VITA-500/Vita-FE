"use client";

import {
  BadgePercent,
  BookOpen,
  CalendarDays,
  MessagesSquare,
  Store,
  UserX,
} from "lucide-react";
import { useAdminAnswerFeedback } from "@/features/admin/feedback/hooks/useAdminAnswerFeedback";
import { useAdminOperationsSummary } from "@/features/admin/dashboard/hooks/useAdminOperationsSummary";
import {
  DashboardMetric,
  FeedbackReactionsCard,
} from "@/features/admin/dashboard/components/AdminDashboardCards";

/** 대시보드는 summary만 쓴다. 질문 목록은 답변 피드백 페이지에서 본다. */
const DASHBOARD_FEEDBACK_LIMIT = 1;

export const AdminDashboard = () => {
  const {
    error: feedbackError,
    isLoading: isFeedbackLoading,
    stats: feedbackStats,
  } = useAdminAnswerFeedback(DASHBOARD_FEEDBACK_LIMIT);
  const operations = useAdminOperationsSummary();
  const hasOperationsError = Boolean(operations.error);
  const operationsSummary = operations.summary;
  const emptyBenefits = operationsSummary?.emptyBenefits ?? 0;
  const qualityTodayCount = feedbackStats
    ? (feedbackStats.summary.todayReasonCounts?.NO_MATCH ?? 0) +
      (feedbackStats.summary.todayReasonCounts?.LOW_SIMILARITY ?? 0)
    : undefined;
  const qualityReasonCounts = feedbackStats
    ? [
        {
          label: "검색 결과 없음",
          count: feedbackStats.summary.reasonCounts?.NO_MATCH ?? 0,
        },
        {
          label: "유사도 낮음",
          count: feedbackStats.summary.reasonCounts?.LOW_SIMILARITY ?? 0,
        },
      ]
    : [];
  const topQualityReason = qualityReasonCounts.reduce(
    (top, current) => (current.count > top.count ? current : top),
    { label: "-", count: 0 },
  );
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          대시보드
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          반복되는 문의와 오늘 발생한 답변 피드백을 우선 확인하고, 운영 현황을
          함께 살펴보세요.
        </p>
      </div>

      <section
        aria-label="운영 주요 지표"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <DashboardMetric
          label="보완 대상"
          value={feedbackStats?.summary.unresolvedCount}
          unit="개"
          extra={
            feedbackStats ? (
              <span className="ml-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                · 누적{" "}
                <span className="font-bold">
                  {feedbackStats.summary.repeatCount.toLocaleString("ko-KR")}
                </span>
                회
              </span>
            ) : null
          }
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="amber"
          icon={<MessagesSquare size={18} aria-hidden="true" />}
          priority="FAQ 보완 우선"
          description="같은 질문을 하나로 묶은 항목 수와, 그 질문들이 누적해서 발생한 횟수예요. 자주 나오는 질문부터 FAQ를 보완하세요."
        />
        <DashboardMetric
          label="오늘 발생"
          value={feedbackStats?.summary.todayCount}
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="blue"
          icon={<CalendarDays size={18} aria-hidden="true" />}
          priority="오늘 확인할 항목"
          description="최근 발생일이 오늘인 보완 대상 질문이에요. 새로 들어온 피드백을 확인하세요."
        />
        <DashboardMetric
          label="오늘 응답 품질 문제"
          value={qualityTodayCount}
          unit="건"
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="rose"
          icon={<BookOpen size={18} aria-hidden="true" />}
          priority="오늘 품질 점검"
          description="검색 결과 없음과 유사도 낮음으로 분류된 오늘의 응답 품질 문제예요."
        />
        <DashboardMetric
          label="주요 품질 문제"
          value={topQualityReason.count}
          unit="건"
          extra={
            feedbackStats && topQualityReason.count > 0 ? (
              <span className="ml-2 max-w-[8rem] truncate text-sm font-semibold text-gray-600 dark:text-gray-300">
                · {topQualityReason.label}
              </span>
            ) : null
          }
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="amber"
          icon={<MessagesSquare size={18} aria-hidden="true" />}
          priority="누적 최다 품질 문제"
          description="응답 품질 문제 중 누적 발생이 가장 많은 유형이에요."
        />
      </section>

      <section aria-label="오늘 사용자 반응과 사유별 발생" className="mt-4">
        <FeedbackReactionsCard
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          likeCount={feedbackStats?.summary.todayLikeCount}
          dislikeCount={feedbackStats?.summary.todayDislikeCount}
          totalLikeCount={feedbackStats?.summary.likeCount}
          totalDislikeCount={feedbackStats?.summary.dislikeCount}
          reasonCounts={feedbackStats?.summary.reasonCounts}
          todayReasonCounts={feedbackStats?.summary.todayReasonCounts}
        />
      </section>

      <section aria-label="운영 현황" className="mt-8">
        <h2 className="mb-3 text-base font-bold text-gray-950 dark:text-white">
          운영 현황
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardMetric
            label="매장"
            value={
              operationsSummary
                ? operationsSummary.phoneStores +
                  operationsSummary.partnerStores
                : undefined
            }
            unit="곳"
            isLoading={operations.isLoading}
            hasError={hasOperationsError}
            tone="neutral"
            icon={<Store size={18} aria-hidden="true" />}
            priority="등록된 매장"
            description={
              operationsSummary
                ? `직영 ${operationsSummary.phoneStores.toLocaleString("ko-KR")}곳 · 제휴 ${operationsSummary.partnerStores.toLocaleString("ko-KR")}곳`
                : "직영·제휴 매장을 합한 수예요."
            }
          />
          <DashboardMetric
            label="제휴 혜택"
            value={operationsSummary?.benefits}
            unit="개"
            isLoading={operations.isLoading}
            hasError={hasOperationsError}
            tone={emptyBenefits > 0 ? "amber" : "neutral"}
            icon={<BadgePercent size={18} aria-hidden="true" />}
            priority={emptyBenefits > 0 ? "매장 연결 필요" : "등록된 혜택"}
            description={
              emptyBenefits > 0
                ? `연결된 매장이 없는 혜택이 ${emptyBenefits.toLocaleString("ko-KR")}개 있어요. 제휴 관리에서 매장을 연결하세요.`
                : "모든 혜택에 매장이 연결되어 있어요."
            }
          />
          <DashboardMetric
            label="게시 중 FAQ"
            value={operationsSummary?.activeFaqs}
            unit="개"
            isLoading={operations.isLoading}
            hasError={hasOperationsError}
            tone="neutral"
            icon={<BookOpen size={18} aria-hidden="true" />}
            priority="챗봇 답변 근거"
            description="챗봇이 참고하는 FAQ 수예요."
          />
          <DashboardMetric
            label="정지 회원"
            value={operationsSummary?.suspendedUsers}
            unit="명"
            isLoading={operations.isLoading}
            hasError={hasOperationsError}
            tone="neutral"
            icon={<UserX size={18} aria-hidden="true" />}
            priority="회원 관리"
            description="이용이 정지된 회원 수예요. 해제는 회원 관리에서 하세요."
          />
        </div>
      </section>
    </div>
  );
};

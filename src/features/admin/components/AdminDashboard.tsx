"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  MessagesSquare,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { AnswerFeedbackContent } from "@/features/admin/components/AnswerFeedbackContent";
import { useAdminAnswerFeedback } from "@/features/admin/context/useAdminAnswerFeedback";
import type { AdminAnswerFeedbackReason } from "@/features/admin/types";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/atoms/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/atoms/Card";
import { cn } from "@/shared/lib/cn";

/** 대시보드는 요약만: 많이 나온 답변 피드백 몇 개를 읽기 전용으로 보여주고, 확인·무시는 답변 피드백 페이지에서 한다. */
const DASHBOARD_FEEDBACK_LIMIT = 5;

export const AdminDashboard = () => {
  const {
    error: feedbackError,
    isLoading: isFeedbackLoading,
    stats: feedbackStats,
  } = useAdminAnswerFeedback(DASHBOARD_FEEDBACK_LIMIT);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          대시보드
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          반복되는 문의와 오늘 발생한 답변 피드백을 우선 확인하세요.
        </p>
      </div>

      <section
        aria-label="운영 주요 지표"
        className="grid gap-4 sm:grid-cols-3"
      >
        <DashboardMetric
          label="답변 피드백"
          value={feedbackStats?.summary.unresolvedCount}
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="neutral"
          icon={<MessagesSquare size={18} aria-hidden="true" />}
          priority="전체 보완 대상"
          description="같은 질문을 하나로 묶은 보완 대상 항목 수예요."
        />
        <DashboardMetric
          label="반복 문의"
          value={feedbackStats?.summary.repeatCount}
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="amber"
          icon={<MessagesSquare size={18} aria-hidden="true" />}
          priority="FAQ 보완 우선"
          description="보완 대상 질문이 누적해서 발생한 횟수예요. 자주 나오는 질문부터 FAQ를 보완하세요."
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
      </section>

      <section
        aria-label="오늘 사용자 반응과 사유별 발생"
        className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]"
      >
        <DashboardMetric
          label="오늘 좋아요"
          value={feedbackStats?.summary.todayLikeCount}
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="emerald"
          icon={<ThumbsUp size={18} aria-hidden="true" />}
          priority="오늘 사용자 반응"
          description="오늘 전체 답변이 받은 좋아요 수예요."
        />
        <DashboardMetric
          label="오늘 아쉬워요"
          value={feedbackStats?.summary.todayDislikeCount}
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          tone="rose"
          icon={<ThumbsDown size={18} aria-hidden="true" />}
          priority="오늘 사용자 반응"
          description="오늘 전체 답변이 받은 아쉬워요 수예요. 이유는 답변 피드백에서 확인하세요."
        />
        <ReasonBreakdown
          isLoading={isFeedbackLoading}
          hasError={Boolean(feedbackError)}
          reasonCounts={feedbackStats?.summary.reasonCounts}
          todayReasonCounts={feedbackStats?.summary.todayReasonCounts}
        />
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader
            title="챗봇 답변 피드백"
            description="많이 나온 순 상위 5건이에요. 유형별 확인과 무시 처리는 답변 피드백 페이지에서 하세요."
          />
          <CardContent>
            <AnswerFeedbackContent
              allowDismiss={false}
              error={feedbackError}
              isLoading={isFeedbackLoading}
              stats={feedbackStats}
            />
            <div className="mt-4 flex justify-end">
              <ButtonLink
                href={routes.adminFeedback}
                variant="secondary"
                size="xs"
              >
                답변 피드백 전체 보기
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const MetricValue = ({
  value,
  isLoading,
  hasError = false,
}: {
  value?: number;
  isLoading: boolean;
  hasError?: boolean;
}) =>
  isLoading ? (
    <span
      role="status"
      aria-label="통계 조회 중"
      className="inline-block h-[1em] w-16 rounded-md bg-current/10 motion-safe:animate-pulse"
    />
  ) : hasError || value === undefined ? (
    <span className="text-sm font-semibold">조회 실패</span>
  ) : (
    <>
      {value.toLocaleString("ko-KR")}
      <span className="ml-1 text-sm font-semibold">건</span>
    </>
  );

type MetricTone = "amber" | "blue" | "neutral" | "emerald" | "rose";

/** 지표 카드 색. 중요도가 높은 지표일수록 색을 진하게 쓴다. */
const metricToneStyles: Record<
  MetricTone,
  { card: string; priority: string; icon: string; value: string }
> = {
  neutral: {
    card: "border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900",
    priority: "text-gray-500 dark:text-gray-400",
    icon: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
    value: "text-gray-700 dark:text-gray-200",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
    priority: "text-amber-700 dark:text-amber-300",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    value: "text-amber-800 dark:text-amber-200",
  },
  blue: {
    card: "border-blue-200 bg-blue-50/70 dark:border-blue-500/25 dark:bg-blue-500/10",
    priority: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    value: "text-blue-800 dark:text-blue-200",
  },
  emerald: {
    card: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    priority: "text-emerald-700 dark:text-emerald-300",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    value: "text-emerald-800 dark:text-emerald-200",
  },
  rose: {
    card: "border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/10",
    priority: "text-rose-700 dark:text-rose-300",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    value: "text-rose-800 dark:text-rose-200",
  },
};

const DashboardMetric = ({
  label,
  value,
  isLoading,
  hasError,
  tone,
  icon,
  priority,
  description,
}: {
  label: string;
  value?: number;
  isLoading: boolean;
  hasError: boolean;
  tone: MetricTone;
  icon: ReactNode;
  priority: string;
  description: string;
}) => {
  const styles = metricToneStyles[tone];

  return (
    <Card className={cn("relative overflow-hidden", styles.card)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-[11px] font-semibold", styles.priority)}>
            {priority}
          </p>
          <h2 className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
            {label}
          </h2>
        </div>
        <span className={cn("shrink-0 rounded-xl p-2", styles.icon)}>
          {icon}
        </span>
      </div>
      <div
        className={cn(
          "mt-3 flex min-h-9 items-center text-3xl font-bold tracking-tight",
          styles.value,
        )}
      >
        <MetricValue value={value} isLoading={isLoading} hasError={hasError} />
      </div>
      <p className="mt-2 max-w-md text-xs leading-5 font-medium text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </Card>
  );
};

const reasonRows: { reason: AdminAnswerFeedbackReason; label: string }[] = [
  { reason: "NO_MATCH", label: "검색 결과 없음" },
  { reason: "LOW_SIMILARITY", label: "유사도 낮음" },
  { reason: "ANSWER_FAILED", label: "답변 실패" },
  { reason: "DISLIKED", label: "아쉬워요" },
];

/** 사유별 발생 수(오늘 / 누적). 어떤 유형의 보완이 많이 필요한지 한눈에 본다. */
const ReasonBreakdown = ({
  hasError,
  isLoading,
  reasonCounts,
  todayReasonCounts,
}: {
  hasError: boolean;
  isLoading: boolean;
  reasonCounts?: Record<AdminAnswerFeedbackReason, number>;
  todayReasonCounts?: Record<AdminAnswerFeedbackReason, number>;
}) => {
  const maxCount = Math.max(
    1,
    ...reasonRows.map(({ reason }) => reasonCounts?.[reason] ?? 0),
  );

  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        보완 유형
      </p>
      <h2 className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
        사유별 발생
      </h2>
      {isLoading ? (
        <p
          role="status"
          aria-label="사유별 발생 조회 중"
          className="mt-4 h-20 rounded-xl bg-gray-100 motion-safe:animate-pulse dark:bg-white/5"
        />
      ) : hasError || !reasonCounts ? (
        <p className="mt-4 text-sm font-semibold text-gray-500">조회 실패</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {reasonRows.map(({ reason, label }) => {
            const total = reasonCounts[reason] ?? 0;
            const today = todayReasonCounts?.[reason] ?? 0;

            return (
              <li key={reason} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-200">
                    {label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    오늘{" "}
                    <span className="text-gray-900 dark:text-white">
                      {today.toLocaleString("ko-KR")}
                    </span>
                    {" · "}누적{" "}
                    <span className="text-gray-900 dark:text-white">
                      {total.toLocaleString("ko-KR")}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="bg-brand h-1.5 rounded-full"
                    style={{ width: `${(total / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

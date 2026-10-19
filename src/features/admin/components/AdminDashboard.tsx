"use client";

import type { ReactNode } from "react";
import { CalendarDays, MessagesSquare } from "lucide-react";
import { AnswerFeedbackContent } from "@/features/admin/components/AnswerFeedbackContent";
import { useAdminAnswerFeedback } from "@/features/admin/context/useAdminAnswerFeedback";
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
  tone: "amber" | "blue" | "neutral";
  icon: ReactNode;
  priority: string;
  description: string;
}) => (
  <Card
    className={cn(
      "relative overflow-hidden",
      tone === "neutral"
        ? "border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10"
          : "border-blue-200 bg-blue-50/70 dark:border-blue-500/25 dark:bg-blue-500/10",
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className={cn(
            "text-[11px] font-semibold",
            tone === "neutral"
              ? "text-gray-500 dark:text-gray-400"
              : tone === "amber"
                ? "text-amber-700 dark:text-amber-300"
                : "text-blue-700 dark:text-blue-300",
          )}
        >
          {priority}
        </p>
        <h2 className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
          {label}
        </h2>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-xl p-2",
          tone === "neutral"
            ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
            : tone === "amber"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        )}
      >
        {icon}
      </span>
    </div>
    <div
      className={cn(
        "mt-3 flex min-h-9 items-center text-3xl font-bold tracking-tight",
        tone === "neutral"
          ? "text-gray-700 dark:text-gray-200"
          : tone === "amber"
            ? "text-amber-800 dark:text-amber-200"
            : "text-blue-800 dark:text-blue-200",
      )}
    >
      <MetricValue value={value} isLoading={isLoading} hasError={hasError} />
    </div>
    <p className="mt-2 max-w-md text-xs leading-5 font-medium text-gray-600 dark:text-gray-300">
      {description}
    </p>
  </Card>
);

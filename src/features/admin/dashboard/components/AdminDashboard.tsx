"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  BadgePercent,
  BookOpen,
  CalendarDays,
  MessagesSquare,
  Store,
  ThumbsDown,
  ThumbsUp,
  UserX,
} from "lucide-react";
import { useAdminAnswerFeedback } from "@/features/admin/feedback/hooks/useAdminAnswerFeedback";
import { useAdminOperationsSummary } from "@/features/admin/dashboard/hooks/useAdminOperationsSummary";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/atoms/Button";
import { Card } from "@/shared/ui/atoms/Card";
import { cn } from "@/shared/lib/cn";
import type { AdminAnswerFeedbackReason } from "@/entities/feedback";
import { FeedbackReasonDonutChart } from "@/features/admin/dashboard/components/FeedbackReasonDonutChart";

/** 차트 라이브러리는 대시보드에서만 쓰므로 따로 불러온다. */
const ReasonBarChart = dynamic(
  () =>
    import("@/features/admin/dashboard/components/ReasonBarChart").then(
      (module) => module.ReasonBarChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-40" />,
  },
);

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

const MetricValue = ({
  value,
  unit = "건",
  isLoading,
  hasError = false,
}: {
  value?: number;
  unit?: string;
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
      <span className="ml-1 text-sm font-semibold">{unit}</span>
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
  unit,
  extra,
  isLoading,
  hasError,
  tone,
  icon,
  priority,
  description,
}: {
  label: string;
  value?: number;
  unit?: string;
  /** 값 옆에 붙는 보조 숫자(예: 누적 횟수). 로딩·실패 중에는 숨긴다. */
  extra?: ReactNode;
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
          "mt-3 flex min-h-9 items-center text-2xl font-bold tracking-tight",
          styles.value,
        )}
      >
        <MetricValue
          value={value}
          unit={unit}
          isLoading={isLoading}
          hasError={hasError}
        />
        {!isLoading && !hasError && extra}
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

/**
 * 오늘 사용자 반응과 사유별 발생을 한 카드에 둔다.
 * 위는 오늘 좋아요·아쉬워요 한 줄, 아래는 사유별 누적 막대(끝에 오늘 수).
 */
const FeedbackReactionsCard = ({
  dislikeCount,
  hasError,
  isLoading,
  likeCount,
  totalDislikeCount,
  totalLikeCount,
  reasonCounts,
  todayReasonCounts,
}: {
  dislikeCount?: number;
  hasError: boolean;
  isLoading: boolean;
  likeCount?: number;
  totalDislikeCount?: number;
  totalLikeCount?: number;
  reasonCounts?: Record<AdminAnswerFeedbackReason, number>;
  todayReasonCounts?: Record<AdminAnswerFeedbackReason, number>;
}) => {
  // 많이 나온 사유가 위로 오게 정렬하고, 차트는 맨 위 사유만 강조색으로 칠한다.
  const rows = reasonRows
    .map(({ reason, label }) => ({
      label,
      today: todayReasonCounts?.[reason] ?? 0,
      total: reasonCounts?.[reason] ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
  const topReason = rows[0]?.total ? rows[0] : null;
  const hasReactions = likeCount !== undefined && dislikeCount !== undefined;
  const reactionTotal = hasReactions ? likeCount + dislikeCount : 0;
  const likeRate =
    hasReactions && reactionTotal > 0
      ? Math.round((likeCount / reactionTotal) * 100)
      : null;
  const hasTotalReactions =
    totalLikeCount !== undefined && totalDislikeCount !== undefined;
  const totalReactionCount = hasTotalReactions
    ? totalLikeCount + totalDislikeCount
    : 0;
  const totalLikeRate =
    hasTotalReactions && totalReactionCount > 0
      ? Math.round((totalLikeCount / totalReactionCount) * 100)
      : null;

  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            사용자 반응 · 보완 유형
          </p>
          <h2 className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
            오늘 반응과 사유별 발생
          </h2>
        </div>
        <ButtonLink
          href={routes.adminFeedback}
          variant="secondary"
          size="xs"
          className="shrink-0"
        >
          답변 피드백 보기
        </ButtonLink>
      </div>
      {isLoading ? (
        <p
          role="status"
          aria-label="통계 조회 중"
          className="mt-4 h-48 rounded-xl bg-gray-100 motion-safe:animate-pulse dark:bg-white/5"
        />
      ) : hasError || !hasReactions || !reasonCounts ? (
        <p className="mt-4 text-sm font-semibold text-gray-500">조회 실패</p>
      ) : (
        <>
          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <ThumbsUp size={14} aria-hidden="true" />
                오늘 좋아요
              </dt>
              <dd className="text-lg font-bold text-gray-900 dark:text-white">
                {likeCount.toLocaleString("ko-KR")}
              </dd>
            </div>
            {hasTotalReactions && (
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  누적 좋아요 / 아쉬워요
                </dt>
                <dd className="text-sm font-bold text-gray-900 dark:text-white">
                  {totalLikeCount.toLocaleString("ko-KR")} /{" "}
                  {totalDislikeCount.toLocaleString("ko-KR")} · 좋아요{" "}
                  {totalLikeRate}%
                </dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                <ThumbsDown size={14} aria-hidden="true" />
                오늘 아쉬워요
              </dt>
              <dd className="text-lg font-bold text-gray-900 dark:text-white">
                {dislikeCount.toLocaleString("ko-KR")}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">
                좋아요 비율
              </dt>
              <dd className="text-lg font-bold text-gray-900 dark:text-white">
                {likeRate === null ? "-" : `${likeRate}%`}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400"></p>
              {topReason && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#218DAE" }}
                  />
                  가장 많은 사유: {topReason.label}
                </p>
              )}
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.4fr)] lg:items-center">
              <div>
                <p className="mb-1 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                  전체 대비 사유 비중
                </p>
                <FeedbackReasonDonutChart rows={rows} />
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {rows.map((row, index) => (
                    <span key={row.label} className="flex items-center gap-1">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: [
                            "#218DAE",
                            "#2BBBD7",
                            "#FCE59A",
                            "#FFD758",
                          ][index % 4],
                        }}
                      />
                      {row.label}
                    </span>
                  ))}
                </div>
              </div>
              <ReasonBarChart rows={rows} />
            </div>
            <table className="sr-only">
              <caption>사유별 발생 수</caption>
              <thead>
                <tr>
                  <th scope="col">사유</th>
                  <th scope="col">오늘</th>
                  <th scope="col">누적</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.today.toLocaleString("ko-KR")}</td>
                    <td>{row.total.toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
};

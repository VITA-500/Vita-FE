"use client";

import { useMemo, useState } from "react";
import {
  answerFeedbackFilterGuides,
  AnswerFeedbackFilterTabs,
} from "@/features/admin/components/AnswerFeedbackFilterTabs";
import { AnswerFeedbackContent } from "@/features/admin/components/AnswerFeedbackContent";
import { useAdminAnswerFeedback } from "@/features/admin/context/useAdminAnswerFeedback";
import {
  countAnswerFeedbackByFilter,
  filterAnswerFeedback,
  type AnswerFeedbackFilter,
  type AnswerFeedbackQualityFilter,
} from "@/features/admin/lib/answerFeedbackFilters";
import { getAnswerFeedbackStatItems } from "@/features/admin/lib/answerFeedbackStats";
import { ADMIN_ANSWER_FEEDBACK_MAX_LIMIT } from "@/entities/feedback";
import { Card, CardContent, CardHeader } from "@/shared/ui/atoms/Card";
import { StatCard } from "@/shared/ui/organisms/StatCard";

const filterTitles: Record<AnswerFeedbackFilter, string> = {
  all: "전체 답변 피드백",
  disliked: "아쉬워요 피드백",
  quality: "응답 품질 관리",
  failed: "답변 실패",
};

/**
 * 답변 피드백 관리 페이지. 많이 나온 순으로 최대 200개를 불러와 유형별로 나눠 보고 무시 처리한다.
 * 대시보드는 요약(상위 몇 건)만 보여주고, 확인·처리는 이 페이지에서 한다.
 */
export const AnswerFeedbackManagement = () => {
  const { error, isLoading, stats } = useAdminAnswerFeedback(
    ADMIN_ANSWER_FEEDBACK_MAX_LIMIT,
  );
  const [filter, setFilter] = useState<AnswerFeedbackFilter>("all");
  const [qualityFilter, setQualityFilter] =
    useState<AnswerFeedbackQualityFilter>("all");
  const statItems = getAnswerFeedbackStatItems(stats?.summary, isLoading);
  const allCandidates = useMemo(() => stats?.candidates ?? [], [stats]);
  const counts = useMemo(
    () => countAnswerFeedbackByFilter(allCandidates),
    [allCandidates],
  );
  const visibleCandidates = useMemo(
    () => filterAnswerFeedback(allCandidates, filter, qualityFilter),
    [allCandidates, filter, qualityFilter],
  );

  const changeFilter = (nextFilter: AnswerFeedbackFilter) => {
    setFilter(nextFilter);
    setQualityFilter("all");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          답변 피드백
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          유형별로 나눠 확인하고, FAQ로 보완했거나 확인이 끝난 피드백은
          무시하세요.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {statItems.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
          />
        ))}
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader
            title={filterTitles[filter]}
            description="같은 질문은 하나로 묶어 발생 횟수가 많은 순으로 보여줍니다. 유형은 가장 최근 사유 기준이에요."
          />
          <CardContent>
            {!isLoading && stats && (
              <div className="mb-5">
                <AnswerFeedbackFilterTabs
                  counts={counts}
                  filter={filter}
                  qualityFilter={qualityFilter}
                  onFilterChange={changeFilter}
                  onQualityFilterChange={setQualityFilter}
                />
              </div>
            )}
            <AnswerFeedbackContent
              candidates={visibleCandidates}
              emptyDescription={answerFeedbackFilterGuides[filter]}
              emptyTitle={
                filter === "all"
                  ? undefined
                  : `${filterTitles[filter]} 항목이 없어요.`
              }
              error={error}
              isLoading={isLoading}
              stats={stats}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

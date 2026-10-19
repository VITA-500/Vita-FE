"use client";

import { useMemo, useState } from "react";
import {
  answerFeedbackFilterGuides,
  AnswerFeedbackFilterTabs,
} from "@/features/admin/components/AnswerFeedbackFilterTabs";
import { AnswerFeedbackContent } from "@/features/admin/components/AnswerFeedbackContent";
import {
  useAdminAnswerFeedback,
  useAdminAnswerFeedbackList,
} from "@/features/admin/context/useAdminAnswerFeedback";
import {
  getAnswerFeedbackTabCounts,
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
 * 답변 피드백 관리 페이지. 탭(유형)마다 서버 사유 필터로 많이 나온 순 최대 200개를 불러와 확인·무시 처리한다.
 * 대시보드는 요약(지표·상위 몇 건)만 보여주고, 확인·처리는 이 페이지에서 한다.
 */
export const AnswerFeedbackManagement = () => {
  // 위쪽 카드와 탭 숫자는 전체 기준 summary를 쓴다(탭을 바꿔도 다시 불러오지 않는다).
  const overview = useAdminAnswerFeedback(ADMIN_ANSWER_FEEDBACK_MAX_LIMIT);
  const [filter, setFilter] = useState<AnswerFeedbackFilter>("all");
  const [qualityFilter, setQualityFilter] =
    useState<AnswerFeedbackQualityFilter>("all");
  const list = useAdminAnswerFeedbackList({
    filter,
    limit: ADMIN_ANSWER_FEEDBACK_MAX_LIMIT,
    qualityFilter,
  });
  const statItems = getAnswerFeedbackStatItems(
    overview.stats?.summary,
    overview.isLoading,
  );
  const counts = useMemo(
    () => getAnswerFeedbackTabCounts(overview.stats),
    [overview.stats],
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
            description="같은 질문은 하나로 묶어 발생 횟수가 많은 순으로 보여줍니다. 탭은 그 유형이 한 번이라도 나온 질문을 모아요."
          />
          <CardContent>
            {overview.stats && (
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
              candidates={list.candidates}
              emptyDescription={answerFeedbackFilterGuides[filter]}
              emptyTitle={
                filter === "all"
                  ? undefined
                  : `${filterTitles[filter]} 항목이 없어요.`
              }
              error={list.error ?? overview.error}
              isLoading={list.isLoading}
              stats={list.stats}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

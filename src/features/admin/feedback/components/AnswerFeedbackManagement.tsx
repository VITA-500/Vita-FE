"use client";

import { useMemo, useState } from "react";
import {
  answerFeedbackFilterGuides,
  AnswerFeedbackFilterTabs,
} from "@/features/admin/feedback/components/AnswerFeedbackFilterTabs";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { AnswerFeedbackContent } from "@/features/admin/feedback/components/AnswerFeedbackContent";
import {
  useAdminAnswerFeedback,
  useAdminAnswerFeedbackList,
} from "@/features/admin/feedback/hooks/useAdminAnswerFeedback";
import {
  getAnswerFeedbackTabCounts,
  type AnswerFeedbackFilter,
  type AnswerFeedbackQualityFilter,
} from "@/features/admin/feedback/lib/answerFeedbackFilters";
import { getAnswerFeedbackSummaryText } from "@/features/admin/feedback/lib/answerFeedbackStats";
import { ADMIN_ANSWER_FEEDBACK_MAX_LIMIT } from "@/entities/feedback";
import { Card, CardContent, CardHeader } from "@/shared/ui/atoms/Card";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";

/** 항목 카드가 길어서(답변·사유 펼침) 한 페이지에 10개씩 보여준다. 목록은 최대 200개를 한 번에 받아 화면에서 나눈다. */
const ANSWER_FEEDBACK_PAGE_SIZE = 10;
type FeedbackSortOrder = "recent" | "oldest";

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
  const [sortOrder, setSortOrder] = useState<FeedbackSortOrder>("recent");
  const list = useAdminAnswerFeedbackList({
    filter,
    limit: ADMIN_ANSWER_FEEDBACK_MAX_LIMIT,
    qualityFilter,
  });
  const [page, setPage] = useState(1);
  const sortedCandidates = useMemo(
    () =>
      [...list.candidates].sort((a, b) => {
        const difference =
          Date.parse(b.lastOccurredAt) - Date.parse(a.lastOccurredAt);
        return sortOrder === "recent" ? difference : -difference;
      }),
    [list.candidates, sortOrder],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(sortedCandidates.length / ANSWER_FEEDBACK_PAGE_SIZE),
  );
  // 무시 처리로 항목이 줄어 마지막 페이지가 사라지면 남은 마지막 페이지를 보여준다.
  const currentPage = Math.min(page, totalPages);
  const pageCandidates = sortedCandidates.slice(
    (currentPage - 1) * ANSWER_FEEDBACK_PAGE_SIZE,
    currentPage * ANSWER_FEEDBACK_PAGE_SIZE,
  );
  const counts = useMemo(
    () => getAnswerFeedbackTabCounts(overview.stats),
    [overview.stats],
  );

  const changeFilter = (nextFilter: AnswerFeedbackFilter) => {
    setFilter(nextFilter);
    setQualityFilter("all");
    setPage(1);
  };

  const changeSortOrder = (nextSortOrder: FeedbackSortOrder) => {
    setSortOrder(nextSortOrder);
    setPage(1);
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
        {/* 숫자는 대시보드와 같아서 카드 대신 한 줄로만 보여준다. */}
        {overview.isLoading ? (
          <span
            role="status"
            aria-label="요약 조회 중"
            className="mt-3 inline-block h-5 w-64 max-w-full rounded-md bg-gray-100 motion-safe:animate-pulse dark:bg-white/5"
          />
        ) : overview.stats ? (
          <p className="mt-3 text-sm font-bold text-gray-800 dark:text-gray-100">
            {getAnswerFeedbackSummaryText(overview.stats.summary)}
          </p>
        ) : null}
      </div>

      <section>
        <Card>
          <CardHeader
            title={filterTitles[filter]}
            description="같은 질문은 하나로 묶어 발생 횟수가 많은 순으로 보여줍니다. 탭은 그 유형이 한 번이라도 나온 질문을 모아요."
          />
          <CardContent>
            {overview.stats && (
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <AnswerFeedbackFilterTabs
                    counts={counts}
                    filter={filter}
                    qualityFilter={qualityFilter}
                    onFilterChange={changeFilter}
                    onQualityFilterChange={(nextQualityFilter) => {
                      setQualityFilter(nextQualityFilter);
                      setPage(1);
                    }}
                  />
                </div>
                <FilterDropdown
                  aria-label="피드백 정렬"
                  value={sortOrder}
                  onChange={(value) =>
                    changeSortOrder(value as FeedbackSortOrder)
                  }
                  options={[
                    { label: "최근순", value: "recent" },
                    { label: "오래된 순", value: "oldest" },
                  ]}
                  className="w-32 shrink-0"
                />
              </div>
            )}
            {!overview.stats && (
              <div className="mb-5 flex justify-end">
                <FilterDropdown
                  aria-label="피드백 정렬"
                  value={sortOrder}
                  onChange={(value) =>
                    changeSortOrder(value as FeedbackSortOrder)
                  }
                  options={[
                    { label: "최근순", value: "recent" },
                    { label: "오래된 순", value: "oldest" },
                  ]}
                  className="w-32"
                />
              </div>
            )}
            <AnswerFeedbackContent
              candidates={pageCandidates}
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
            {!list.isLoading && sortedCandidates.length > 0 && (
              <div className="border-border-soft mt-5 flex justify-center border-t pt-4 dark:border-white/10">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

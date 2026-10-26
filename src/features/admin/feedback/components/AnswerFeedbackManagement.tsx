"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { ADMIN_ANSWER_FEEDBACK_MAX_LIMIT } from "@/entities/feedback";
import { Card, CardContent, CardHeader } from "@/shared/ui/atoms/Card";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { Button } from "@/shared/ui/atoms/Button";

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
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");
  // 위쪽 카드와 탭 숫자는 전체 기준 summary를 쓴다(탭을 바꿔도 다시 불러오지 않는다).
  const overview = useAdminAnswerFeedback(ADMIN_ANSWER_FEEDBACK_MAX_LIMIT);
  const [filter, setFilter] = useState<AnswerFeedbackFilter>(() =>
    initialFilter === "quality" ||
    initialFilter === "disliked" ||
    initialFilter === "failed"
      ? initialFilter
      : "all",
  );
  const [qualityFilter, setQualityFilter] =
    useState<AnswerFeedbackQualityFilter>("all");
  const [sortOrder, setSortOrder] = useState<FeedbackSortOrder>("recent");
  const [keyword, setKeyword] = useState("");
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
  const filteredCandidates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
    if (!normalizedKeyword) return sortedCandidates;

    return sortedCandidates.filter((candidate) =>
      [candidate.question, candidate.answer ?? "", candidate.failReason]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedKeyword),
    );
  }, [keyword, sortedCandidates]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCandidates.length / ANSWER_FEEDBACK_PAGE_SIZE),
  );
  // 무시 처리로 항목이 줄어 마지막 페이지가 사라지면 남은 마지막 페이지를 보여준다.
  const currentPage = Math.min(page, totalPages);
  const pageCandidates = filteredCandidates.slice(
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

  const clearFilters = () => {
    setKeyword("");
    setSortOrder("recent");
    changeFilter("all");
  };
  const highRepeatCount =
    overview.stats?.candidates.filter((candidate) => candidate.count >= 10)
      .length ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
          답변 피드백
        </h1>
        <p className="text-text-secondary mt-2 text-sm leading-6 font-normal">
          유형별로 나눠 확인하고, FAQ로 보완했거나 확인이 끝난 피드백은
          무시하세요.
        </p>
      </div>

      <section
        aria-label="답변 피드백 운영 지표"
        className="mb-6 grid overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] dark:border-white/10 dark:bg-white/10"
      >
        <div className="grid bg-white sm:grid-cols-3 dark:bg-zinc-900">
          {[
            ["해결 필요", overview.stats?.summary.unresolvedCount, "개"],
            ["반복 발생", overview.stats?.summary.repeatCount, "회"],
            ["오늘 신규", overview.stats?.summary.todayCount, "건"],
          ].map(([label, value, unit]) => (
            <div key={label} className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {label}
              </p>
              {overview.isLoading ? (
                <span className="mt-2 inline-block h-8 w-16 rounded-md bg-gray-100 motion-safe:animate-pulse dark:bg-white/10" />
              ) : (
                <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                  {value?.toLocaleString("ko-KR") ?? "-"}
                  <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {unit}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-gray-950 px-5 py-4 text-white dark:bg-gray-800">
          <span className="text-amber-300" aria-hidden="true">
            ⚠
          </span>
          <p className="text-sm leading-6 font-semibold break-keep text-amber-100">
            {overview.isLoading
              ? "우선순위를 계산하고 있어요."
              : highRepeatCount > 0
                ? `반복 10회 이상인 질문 ${highRepeatCount}개를 먼저 확인하세요.`
                : "반복 발생이 많은 질문부터 확인하세요."}
          </p>
        </div>
      </section>

      <section>
        <Card>
          <CardHeader
            title={filterTitles[filter]}
            description="같은 질문은 하나로 묶어 발생 횟수가 많은 순으로 보여줍니다. 탭은 그 유형이 한 번이라도 나온 질문을 모아요."
          />
          <CardContent>
            {overview.stats && (
              <div className="mb-5 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <SearchInput
                    className="min-w-0 flex-1"
                    placeholder="질문·답변·문제 유형 검색"
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value);
                      setPage(1);
                    }}
                  />
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
                    className="w-full shrink-0 sm:w-32"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={clearFilters}
                    disabled={
                      !keyword && filter === "all" && sortOrder === "recent"
                    }
                  >
                    필터 초기화
                  </Button>
                </div>
                <div className="border-border-soft rounded-xl border p-3 dark:border-white/10">
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
            {!list.isLoading && filteredCandidates.length > 0 && (
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

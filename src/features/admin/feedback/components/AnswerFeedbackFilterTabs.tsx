"use client";

import type {
  AnswerFeedbackFilter,
  AnswerFeedbackQualityFilter,
  getAnswerFeedbackTabCounts,
} from "@/features/admin/feedback/lib/answerFeedbackFilters";
import { cn } from "@/shared/lib/cn";

type FeedbackCounts = ReturnType<typeof getAnswerFeedbackTabCounts>;

const filterTabs: {
  value: AnswerFeedbackFilter;
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "disliked", label: "아쉬워요" },
  { value: "quality", label: "응답 품질" },
  { value: "failed", label: "답변 실패" },
];

const qualityTabs: {
  value: AnswerFeedbackQualityFilter;
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "NO_MATCH", label: "검색 결과 없음" },
  { value: "LOW_SIMILARITY", label: "유사도 낮음" },
];

/** 탭마다 무엇을 확인하면 되는지 짧게 안내한다. */
export const answerFeedbackFilterGuides: Record<AnswerFeedbackFilter, string> =
  {
    all: "챗봇이 답하지 못했거나 사용자가 아쉬워요를 누른 답변을 모두 모았어요.",
    disliked:
      "사용자가 직접 아쉬워요를 누른 답변이에요. 남긴 이유를 펼쳐서 확인하세요.",
    quality:
      "참고할 FAQ를 찾지 못했거나(검색 결과 없음) 비슷한 FAQ가 기준에 못 미친(유사도 낮음) 질문이에요. FAQ를 추가하거나 보완하세요.",
    failed:
      "답변을 만드는 중 오류가 난 질문이에요. FAQ보다 챗봇·서버 상태를 먼저 확인하세요.",
  };

type AnswerFeedbackFilterTabsProps = {
  counts: FeedbackCounts;
  filter: AnswerFeedbackFilter;
  qualityFilter: AnswerFeedbackQualityFilter;
  onFilterChange: (filter: AnswerFeedbackFilter) => void;
  onQualityFilterChange: (filter: AnswerFeedbackQualityFilter) => void;
};

/** 답변 피드백 페이지의 유형 탭. 응답 품질 탭은 검색 결과 없음·유사도 낮음으로 한 번 더 나눈다. */
export const AnswerFeedbackFilterTabs = ({
  counts,
  filter,
  qualityFilter,
  onFilterChange,
  onQualityFilterChange,
}: AnswerFeedbackFilterTabsProps) => (
  <div className="space-y-3">
    <div
      role="tablist"
      aria-label="답변 피드백 유형"
      className="flex flex-wrap gap-2"
    >
      {filterTabs.map((tab) => (
        <FilterChip
          key={tab.value}
          role="tab"
          isActive={filter === tab.value}
          label={tab.label}
          count={counts[tab.value]}
          onClick={() => onFilterChange(tab.value)}
        />
      ))}
    </div>

    {filter === "quality" && (
      <div
        role="group"
        aria-label="응답 품질 세부 유형"
        className="flex flex-wrap gap-1.5"
      >
        {qualityTabs.map((tab) => (
          <FilterChip
            key={tab.value}
            size="sm"
            isActive={qualityFilter === tab.value}
            label={tab.label}
            count={tab.value === "all" ? counts.quality : counts[tab.value]}
            onClick={() => onQualityFilterChange(tab.value)}
          />
        ))}
      </div>
    )}

    <p className="text-text-secondary text-xs leading-5 font-medium">
      {answerFeedbackFilterGuides[filter]}
      <span className="ml-1 text-gray-400">(탭 숫자는 발생 횟수예요)</span>
    </p>
  </div>
);

const FilterChip = ({
  count,
  isActive,
  label,
  onClick,
  role,
  size = "md",
}: {
  count: number;
  isActive: boolean;
  label: string;
  onClick: () => void;
  role?: "tab";
  size?: "md" | "sm";
}) => (
  <button
    type="button"
    role={role}
    aria-selected={role === "tab" ? isActive : undefined}
    aria-pressed={role === "tab" ? undefined : isActive}
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-lg border font-semibold transition",
      size === "md" ? "h-8 px-3 text-sm" : "h-7 px-2.5 text-xs",
      isActive
        ? "border-brand bg-brand-soft text-brand dark:bg-brand/15"
        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-white/5",
    )}
  >
    {label}
    <span
      className={cn(
        "rounded-full px-1.5 text-[11px] leading-5 font-extrabold",
        isActive
          ? "bg-brand text-white"
          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
      )}
    >
      {count.toLocaleString("ko-KR")}
    </span>
  </button>
);

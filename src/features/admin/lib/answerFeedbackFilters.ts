import type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackReason,
  AdminAnswerFeedbackStats,
} from "@/features/admin/types";

/**
 * 답변 피드백 페이지의 필터.
 * - all: 전체
 * - disliked: 사용자가 아쉬워요를 누른 답변
 * - quality: 응답 품질(검색 결과 없음·유사도 낮음). FAQ를 보완하면 해결되는 항목
 * - failed: 답변 생성 실패. FAQ보다 챗봇·서버 상태를 확인할 항목
 */
export type AnswerFeedbackFilter = "all" | "disliked" | "quality" | "failed";

/** 응답 품질 탭 안의 세부 필터 */
export type AnswerFeedbackQualityFilter = "all" | "NO_MATCH" | "LOW_SIMILARITY";

const filterReasons: Record<
  Exclude<AnswerFeedbackFilter, "all">,
  readonly AdminAnswerFeedbackReason[]
> = {
  disliked: ["DISLIKED"],
  quality: ["NO_MATCH", "LOW_SIMILARITY"],
  failed: ["ANSWER_FAILED"],
};

/**
 * 탭이 서버에 요청할 사유 목록(GET /admin/stats/chat?reason=).
 * - [undefined]: 사유 없이 전체
 * - 응답 품질 "전체"는 사유를 하나만 받는 BE에 맞춰 두 사유를 따로 요청해 합친다.
 */
export const getAnswerFeedbackReasons = (
  filter: AnswerFeedbackFilter,
  qualityFilter: AnswerFeedbackQualityFilter = "all",
): (AdminAnswerFeedbackReason | undefined)[] => {
  if (filter === "all") return [undefined];
  if (filter === "quality" && qualityFilter !== "all") return [qualityFilter];
  return [...filterReasons[filter]];
};

/**
 * 사유별로 받은 목록을 하나로 합친다. 두 사유가 모두 있는 항목은 한 번만 남기고,
 * BE와 같은 순서(발생 횟수 많은 순 → 최근 발생 순)로 정렬한다.
 */
export const mergeAnswerFeedbackCandidates = (
  lists: readonly (readonly AdminAnswerFeedback[])[],
) => {
  if (lists.length === 1) return [...lists[0]];

  const byId = new Map<number, AdminAnswerFeedback>();

  lists.flat().forEach((candidate) => {
    if (!byId.has(candidate.id)) byId.set(candidate.id, candidate);
  });

  return Array.from(byId.values()).sort(
    (a, b) =>
      b.count - a.count || b.lastOccurredAt.localeCompare(a.lastOccurredAt),
  );
};

/**
 * 탭 숫자. BE 사유별 발생 수(reasonCounts)가 있으면 그 값을, 없으면(예전 응답·목업) 목록에서 센다.
 * 사유별 발생 수는 같은 답변이 자동 감지와 아쉬워요를 모두 받으면 두 사유에 하나씩 센다.
 */
export const getAnswerFeedbackTabCounts = (
  stats: AdminAnswerFeedbackStats | null,
) => {
  const reasonCounts = stats?.summary.reasonCounts;

  if (!stats || !reasonCounts) {
    return countAnswerFeedbackByFilter(stats?.candidates ?? []);
  }

  return {
    all: stats.summary.repeatCount,
    disliked: reasonCounts.DISLIKED,
    quality: reasonCounts.NO_MATCH + reasonCounts.LOW_SIMILARITY,
    failed: reasonCounts.ANSWER_FAILED,
    NO_MATCH: reasonCounts.NO_MATCH,
    LOW_SIMILARITY: reasonCounts.LOW_SIMILARITY,
  };
};

/**
 * 필터에 맞는 항목만 남긴다(API가 없는 목업 환경용).
 * 목업에는 항목마다 "가장 최근 사유" 하나만 있으므로 그 값을 기준으로 거른다.
 * 실제 API는 서버 필터(getAnswerFeedbackReasons)를 쓴다.
 */
export const filterAnswerFeedback = (
  candidates: readonly AdminAnswerFeedback[],
  filter: AnswerFeedbackFilter,
  qualityFilter: AnswerFeedbackQualityFilter = "all",
) => {
  if (filter === "all") return [...candidates];

  const reasons: readonly string[] =
    filter === "quality" && qualityFilter !== "all"
      ? [qualityFilter]
      : filterReasons[filter];

  return candidates.filter((candidate) =>
    reasons.includes(candidate.failReason),
  );
};

/** 탭에 보여줄 필터별 항목 수 */
export const countAnswerFeedbackByFilter = (
  candidates: readonly AdminAnswerFeedback[],
) => ({
  all: candidates.length,
  disliked: filterAnswerFeedback(candidates, "disliked").length,
  quality: filterAnswerFeedback(candidates, "quality").length,
  failed: filterAnswerFeedback(candidates, "failed").length,
  NO_MATCH: filterAnswerFeedback(candidates, "quality", "NO_MATCH").length,
  LOW_SIMILARITY: filterAnswerFeedback(candidates, "quality", "LOW_SIMILARITY")
    .length,
});

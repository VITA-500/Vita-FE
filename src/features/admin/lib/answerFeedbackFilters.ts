import type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackReason,
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
 * 필터에 맞는 항목만 남긴다.
 * BE 응답에는 항목마다 "가장 최근 사유" 하나만 오므로 그 값을 기준으로 거른다.
 * (BE에 reason 필터가 생기면 서버 기준으로 바꾼다)
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

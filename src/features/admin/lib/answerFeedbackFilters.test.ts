import { describe, expect, it } from "vitest";
import type { AdminAnswerFeedback } from "@/features/admin/types";
import {
  countAnswerFeedbackByFilter,
  filterAnswerFeedback,
} from "./answerFeedbackFilters";

const candidate = (
  id: number,
  failReason: AdminAnswerFeedback["failReason"],
): AdminAnswerFeedback => ({
  id,
  question: `질문 ${id}`,
  answer: null,
  source: "CHAT",
  failReason,
  count: 1,
  lastOccurredAt: "2026-10-19T10:00:00",
});

const candidates = [
  candidate(1, "DISLIKED"),
  candidate(2, "NO_MATCH"),
  candidate(3, "LOW_SIMILARITY"),
  candidate(4, "ANSWER_FAILED"),
  candidate(5, "NO_MATCH"),
];

const ids = (list: AdminAnswerFeedback[]) => list.map(({ id }) => id);

describe("answer feedback filters", () => {
  it("filters by the latest reason of each item", () => {
    expect(ids(filterAnswerFeedback(candidates, "all"))).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(ids(filterAnswerFeedback(candidates, "disliked"))).toEqual([1]);
    expect(ids(filterAnswerFeedback(candidates, "quality"))).toEqual([2, 3, 5]);
    expect(ids(filterAnswerFeedback(candidates, "failed"))).toEqual([4]);
  });

  it("narrows the quality tab to no match or low similarity", () => {
    expect(
      ids(filterAnswerFeedback(candidates, "quality", "NO_MATCH")),
    ).toEqual([2, 5]);
    expect(
      ids(filterAnswerFeedback(candidates, "quality", "LOW_SIMILARITY")),
    ).toEqual([3]);
  });

  it("counts every tab", () => {
    expect(countAnswerFeedbackByFilter(candidates)).toEqual({
      all: 5,
      disliked: 1,
      quality: 3,
      failed: 1,
      NO_MATCH: 2,
      LOW_SIMILARITY: 1,
    });
  });
});

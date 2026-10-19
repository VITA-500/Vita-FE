import { describe, expect, it } from "vitest";
import type { AdminAnswerFeedback } from "@/features/admin/types";
import {
  countAnswerFeedbackByFilter,
  filterAnswerFeedback,
  getAnswerFeedbackReasons,
  getAnswerFeedbackTabCounts,
  mergeAnswerFeedbackCandidates,
  withMatchedReasons,
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

  it("maps tabs to server reason filters", () => {
    expect(getAnswerFeedbackReasons("all")).toEqual([undefined]);
    expect(getAnswerFeedbackReasons("disliked")).toEqual(["DISLIKED"]);
    expect(getAnswerFeedbackReasons("failed")).toEqual(["ANSWER_FAILED"]);
    expect(getAnswerFeedbackReasons("quality")).toEqual([
      "NO_MATCH",
      "LOW_SIMILARITY",
    ]);
    expect(getAnswerFeedbackReasons("quality", "LOW_SIMILARITY")).toEqual([
      "LOW_SIMILARITY",
    ]);
  });

  it("merges reason lists without duplicates in count order", () => {
    const shared = { ...candidate(7, "NO_MATCH"), count: 5 };
    const merged = mergeAnswerFeedbackCandidates([
      [shared, { ...candidate(8, "NO_MATCH"), count: 1 }],
      [shared, { ...candidate(9, "LOW_SIMILARITY"), count: 3 }],
    ]);

    expect(ids(merged)).toEqual([7, 9, 8]);
  });

  it("uses server reason counts for tabs when available", () => {
    expect(
      getAnswerFeedbackTabCounts({
        summary: {
          unresolvedCount: 4,
          repeatCount: 20,
          todayCount: 1,
          reasonCounts: {
            NO_MATCH: 6,
            LOW_SIMILARITY: 4,
            ANSWER_FAILED: 2,
            DISLIKED: 9,
          },
        },
        candidates: [],
      }),
    ).toEqual({
      all: 20,
      disliked: 9,
      quality: 10,
      failed: 2,
      NO_MATCH: 6,
      LOW_SIMILARITY: 4,
    });
  });

  describe("withMatchedReasons", () => {
    it("tags each item with the reason lists it came from", () => {
      const shared = candidate(1, "NO_MATCH");
      const onlyLow = candidate(2, "ANSWER_FAILED");
      const items = withMatchedReasons(
        [shared, onlyLow],
        ["NO_MATCH", "LOW_SIMILARITY"],
        [[shared], [shared, onlyLow]],
      );

      expect(items[0].matchedReasons).toEqual(["NO_MATCH", "LOW_SIMILARITY"]);
      // 최근 사유(ANSWER_FAILED)와 달라도 걸린 사유는 LOW_SIMILARITY다.
      expect(items[1].matchedReasons).toEqual(["LOW_SIMILARITY"]);
    });

    it("does not tag items on the all tab", () => {
      const items = withMatchedReasons(
        [candidate(1, "NO_MATCH")],
        [undefined],
        [[candidate(1, "NO_MATCH")]],
      );

      expect(items[0].matchedReasons).toBeUndefined();
    });
  });
});

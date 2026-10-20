import { describe, expect, it } from "vitest";
import {
  buildChatSearchItems,
  getSearchPeriodRange,
  matchesSearchDates,
  toSearchDate,
} from "@/features/chat/search/lib/chatSearch";

describe("chat search dates", () => {
  it("includes today in relative periods across month boundaries", () => {
    const now = new Date("2026-11-02T12:00:00");
    expect(getSearchPeriodRange("today", "", "", "", now)).toEqual([
      "2026-11-02",
      "2026-11-02",
    ]);
    expect(getSearchPeriodRange("week", "", "", "", now)).toEqual([
      "2026-10-27",
      "2026-11-02",
    ]);
    expect(getSearchPeriodRange("month", "", "", "", now)).toEqual([
      "2026-10-04",
      "2026-11-02",
    ]);
    expect(
      getSearchPeriodRange("all", "", "2026-01-01", "2026-01-02", now),
    ).toEqual(["", ""]);
  });
  it("uses the local calendar day and handles invalid server dates", () => {
    expect(toSearchDate("2026-10-16T23:59:59")).toBe("2026-10-16");
    expect(toSearchDate("invalid")).toBe("");
    expect(matchesSearchDates("", "2026-10-16", "")).toBe(false);
    expect(matchesSearchDates("", "", "")).toBe(true);
  });
  it("preserves the current session date and avoids duplicate current sessions", () => {
    const items = buildChatSearchItems(
      [{ sessionId: 1, title: "이전 제목", updatedAt: "2026-10-16T10:00:00" }],
      "현재 제목",
      1,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: "현재 제목", date: "2026-10-16" });
    const unsaved = buildChatSearchItems([], "새 상담");
    expect(unsaved[0]).toMatchObject({ sessionId: null, date: "" });
  });
});

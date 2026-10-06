import { describe, expect, it } from "vitest";
import { formatKoreanDate, formatKoreanMonthDay } from "./date";

describe("date formatters", () => {
  it("returns dash when value is empty", () => {
    expect(formatKoreanDate()).toBe("-");
    expect(formatKoreanMonthDay()).toBe("-");
  });

  it("formats valid date strings in Korean date style", () => {
    expect(formatKoreanDate("2026-10-02T00:00:00.000Z")).toBe("2026. 10. 02.");
    expect(formatKoreanMonthDay("2026-10-02T00:00:00.000Z")).toBe("10. 02.");
  });

  it("falls back to stable string slices when date parsing fails", () => {
    expect(formatKoreanDate("not-a-date-value")).toBe("not-a-date");
    expect(formatKoreanMonthDay("not-a-date-value")).toBe("-date");
  });
});

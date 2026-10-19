import { describe, expect, it } from "vitest";
import {
  buildReservationTimeSlots,
  parseBusinessHours,
} from "./reservationTimeSlots";

describe("reservationTimeSlots", () => {
  it("parses hyphen and tilde business hours", () => {
    expect(parseBusinessHours("09:00-18:00")).toEqual({
      closeMinutes: 1080,
      openMinutes: 540,
    });
    expect(parseBusinessHours("평일 10:00~20:00")).toEqual({
      closeMinutes: 1200,
      openMinutes: 600,
    });
  });

  it("builds half-hour slots until thirty minutes before closing", () => {
    const slots = buildReservationTimeSlots({
      businessHours: "09:00-10:30",
      date: "2026-10-09",
      now: new Date("2026-10-08T12:00:00"),
    });

    expect(slots.map((slot) => slot.value)).toEqual([
      "09:00",
      "09:30",
      "10:00",
    ]);
  });

  it("marks past slots on the selected date", () => {
    const slots = buildReservationTimeSlots({
      businessHours: "09:00-11:00",
      date: "2026-10-08",
      now: new Date("2026-10-08T09:20:00"),
    });

    expect(slots.map((slot) => [slot.value, slot.isPast])).toEqual([
      ["09:00", true],
      ["09:30", false],
      ["10:00", false],
      ["10:30", false],
    ]);
  });
});

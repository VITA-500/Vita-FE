import { describe, expect, it } from "vitest";
import type { StoreLocation } from "@/entities/store/model/types";
import {
  filterStoresByOpenFilter,
  getCurrentOpenState,
  getCurrentOpenStatus,
  getNextOpenFilterTime,
  isOpenAtTime,
  toOpenFilterParams,
} from "./storeOpenHours";

const store = (overrides: Partial<StoreLocation>): StoreLocation => ({
  id: "1",
  name: "VITA 강남점",
  address: "",
  phone: "",
  lat: 37.5,
  lng: 127,
  ...overrides,
});

describe("isOpenAtTime", () => {
  it("includes the opening time and excludes the closing time", () => {
    expect(isOpenAtTime("10:00-20:00", "10:00")).toBe(true);
    expect(isOpenAtTime("10:00-20:00", "19:59")).toBe(true);
    expect(isOpenAtTime("10:00-20:00", "20:00")).toBe(false);
    expect(isOpenAtTime("10:00-20:00", "09:30")).toBe(false);
  });

  it("supports business hours past midnight", () => {
    expect(isOpenAtTime("22:00-02:00", "23:30")).toBe(true);
    expect(isOpenAtTime("22:00-02:00", "01:00")).toBe(true);
    expect(isOpenAtTime("22:00-02:00", "03:00")).toBe(false);
  });

  it("returns undefined when hours cannot be read", () => {
    expect(isOpenAtTime(undefined, "10:00")).toBeUndefined();
    expect(isOpenAtTime("연중무휴", "10:00")).toBeUndefined();
  });
});

describe("toOpenFilterParams", () => {
  it("sends openNow or openAt, never both", () => {
    expect(toOpenFilterParams({ mode: "all" })).toEqual({});
    expect(toOpenFilterParams({ mode: "now" })).toEqual({ openNow: "true" });
    expect(toOpenFilterParams({ mode: "at", time: "18:00" })).toEqual({
      openAt: "18:00",
    });
  });
});

describe("filterStoresByOpenFilter", () => {
  const stores = [
    store({ id: "a", openNow: true, businessHours: "10:00-20:00" }),
    store({ id: "b", openNow: false, businessHours: "12:00-22:00" }),
    store({ id: "c" }),
  ];

  it("keeps stores without open info", () => {
    expect(
      filterStoresByOpenFilter(stores, { mode: "now" }).map((s) => s.id),
    ).toEqual(["a", "c"]);
    expect(
      filterStoresByOpenFilter(stores, { mode: "at", time: "21:00" }).map(
        (s) => s.id,
      ),
    ).toEqual(["b", "c"]);
  });
});

describe("getNextOpenFilterTime", () => {
  it("rounds up to the next 30-minute slot within range", () => {
    expect(getNextOpenFilterTime(new Date(2026, 9, 8, 14, 10))).toBe("14:30");
    expect(getNextOpenFilterTime(new Date(2026, 9, 8, 3, 0))).toBe("07:00");
    expect(getNextOpenFilterTime(new Date(2026, 9, 8, 23, 50))).toBe("23:30");
  });
});

describe("getCurrentOpenStatus", () => {
  it("recomputes from business hours and falls back to openNow", () => {
    const at15 = new Date(2026, 9, 8, 15, 0);

    expect(
      getCurrentOpenStatus(
        { businessHours: "10:00-14:00", openNow: true },
        at15,
      ),
    ).toBe(false);
    expect(getCurrentOpenStatus({ openNow: true }, at15)).toBe(true);
    expect(getCurrentOpenStatus({}, at15)).toBeUndefined();
  });
});

describe("getCurrentOpenState", () => {
  it("splits closed stores into before opening and after closing", () => {
    expect(
      getCurrentOpenState(
        { businessHours: "10:00-20:00", openNow: false },
        new Date(2026, 9, 8, 9, 30),
      ),
    ).toBe("before");
    expect(
      getCurrentOpenState(
        { businessHours: "10:00-20:00", openNow: false },
        new Date(2026, 9, 8, 20, 30),
      ),
    ).toBe("closed");
    expect(
      getCurrentOpenState(
        { businessHours: "10:00-20:00", openNow: false },
        new Date(2026, 9, 8, 12, 0),
      ),
    ).toBe("open");
  });

  it("keeps fallback behavior when business hours cannot be parsed", () => {
    expect(getCurrentOpenState({ openNow: true })).toBe("open");
    expect(getCurrentOpenState({ openNow: false })).toBe("closed");
    expect(getCurrentOpenState({})).toBeUndefined();
  });
});

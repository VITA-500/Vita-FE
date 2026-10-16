import { describe, expect, it } from "vitest";
import type { TransitRouteStep } from "@/features/store/lib/storeRoutePreview";
import { buildTransitTimeline } from "@/features/store/lib/transitTimeline";

const step = (
  overrides: Partial<TransitRouteStep> & Pick<TransitRouteStep, "id" | "kind">,
): TransitRouteStep => ({
  description: "",
  detailMeta: "약 1분 이동",
  lineName: overrides.kind === "walk" ? "도보" : "노선",
  meta: "약 1분",
  path: [],
  ...overrides,
});

describe("buildTransitTimeline", () => {
  it("merges a same-station transfer and keeps separate boarding after a walk", () => {
    const items = buildTransitTimeline(
      [
        step({ id: "w0", kind: "walk" }),
        step({
          alightName: "선정릉",
          boardName: "선릉",
          color: "#f5a200",
          id: "s1",
          kind: "subway",
          lineName: "수인분당선",
          vehicleType: "급행",
        }),
        step({ id: "w1", kind: "walk" }),
        step({
          alightName: "동작",
          boardName: "선정릉",
          id: "s2",
          kind: "subway",
          lineName: "9호선",
        }),
        step({ guidance: "6번 출구로 나와서 이동", id: "w2", kind: "walk" }),
        step({
          alightName: "흑석동",
          boardName: "동작역.국립현충원",
          id: "b1",
          kind: "bus",
          lineName: "5524",
        }),
        step({ id: "w3", kind: "walk" }),
      ],
      "비타 흑석점",
    );

    expect(
      items.map((item) => {
        if (item.type === "board") return `${item.stationName} ${item.action}`;
        if (item.type === "alight") return `${item.stationName} 하차`;
        if (item.type === "walk") return item.text;
        if (item.type === "end") return `도착 ${item.name}`;
        return "출발";
      }),
    ).toEqual([
      "출발",
      "선릉까지 도보 이동",
      "선릉 승차",
      "선정릉 환승",
      "동작 하차",
      "6번 출구로 나와서 이동",
      "동작역.국립현충원 승차",
      "흑석동 하차",
      "비타 흑석점까지 도보 이동",
      "도착 비타 흑석점",
    ]);
  });

  it("returns nothing without steps", () => {
    expect(buildTransitTimeline([], "매장")).toEqual([]);
  });
});

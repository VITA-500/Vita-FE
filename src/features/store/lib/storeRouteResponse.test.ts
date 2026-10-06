import { describe, expect, it } from "vitest";
import {
  getRoutePath,
  getRouteSegments,
  type RouteResponse,
} from "@/features/store/lib/storeRouteResponse";

const baseResponse = {
  distanceMeters: 1200,
  durationSeconds: 900,
  mode: "transit",
} satisfies Partial<RouteResponse>;

describe("getRoutePath", () => {
  it("reads points written as lat/lng, latitude/longitude or x/y", () => {
    expect(
      getRoutePath({
        ...baseResponse,
        path: [
          { lat: 37.5, lng: 127.0 },
          { latitude: "37.51", longitude: "127.01" },
          { x: 127.02, y: 37.52 },
        ],
      }),
    ).toEqual([
      { lat: 37.5, lng: 127.0 },
      { lat: 37.51, lng: 127.01 },
      { lat: 37.52, lng: 127.02 },
    ]);
  });

  it("parses a TMAP-style linestring of lng,lat pairs", () => {
    expect(
      getRoutePath({
        ...baseResponse,
        sections: [{ linestring: "127.1,37.5 127.2,37.6" }],
      }),
    ).toEqual([
      { lat: 37.5, lng: 127.1 },
      { lat: 37.6, lng: 127.2 },
    ]);
  });
});

describe("getRouteSegments", () => {
  const station = (lng: number, lat: number) => ({
    x: String(lng),
    y: String(lat),
  });

  it("maps ODsay sub paths to walk / subway / bus segments", () => {
    const segments = getRouteSegments({
      ...baseResponse,
      segments: [
        {
          subPath: [
            {
              path: [
                { lat: 37.5, lng: 127.0 },
                { lat: 37.501, lng: 127.0 },
              ],
              trafficType: 3,
            },
            {
              lane: [{ name: "수도권 2호선" }],
              passStopList: {
                stations: [station(127.0, 37.501), station(127.01, 37.51)],
              },
              trafficType: 1,
            },
            {
              lane: [{ busNo: "146" }],
              passStopList: {
                stations: [station(127.01, 37.51), station(127.02, 37.52)],
              },
              trafficType: 2,
            },
          ],
        },
      ],
    });

    expect(
      segments.map(({ color, kind, lineName }) => ({ color, kind, lineName })),
    ).toEqual([
      { kind: "walk" },
      { color: "#00a84d", kind: "subway", lineName: "수도권 2호선" },
      { kind: "bus", lineName: "146" },
    ]);
    expect(segments[1].path).toEqual([
      { lat: 37.501, lng: 127.0 },
      { lat: 37.51, lng: 127.01 },
    ]);
  });

  it("prefers the response color and adds a missing #", () => {
    const [segment] = getRouteSegments({
      ...baseResponse,
      segments: [
        {
          color: "ff0000",
          mode: "BUS",
          path: [{ lat: 37.5, lng: 127.0 }],
        },
      ],
    });

    expect(segment).toMatchObject({ color: "#ff0000", kind: "bus" });
  });

  it("matches 신분당선 before 분당 when guessing a subway color", () => {
    const [segment] = getRouteSegments({
      ...baseResponse,
      segments: [
        {
          lineName: "신분당선",
          path: [{ lat: 37.5, lng: 127.0 }],
          type: "subway",
        },
      ],
    });

    expect(segment.color).toBe("#d4003b");
  });

  it("drops segments without any coordinates", () => {
    expect(
      getRouteSegments({
        ...baseResponse,
        segments: [{ trafficType: 3 }],
      }),
    ).toEqual([]);
  });
});

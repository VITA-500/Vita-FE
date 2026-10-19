import { describe, expect, it } from "vitest";
import { buildRouteSummary } from "@/features/store/lib/storeRoutePreview";
import type { StoreLocation } from "@/entities/store";
import type { StoreRoute } from "@/entities/route";

const store: StoreLocation = {
  id: "store-1",
  name: "비타 강남점",
  address: "서울 강남구",
  phone: "02-1234-5678",
  lat: 37.51,
  lng: 127.01,
};

describe("buildRouteSummary", () => {
  it("adds transit step instructions from route segments", () => {
    const route: StoreRoute = {
      distanceMeters: 1500,
      durationSeconds: 900,
      mode: "transit",
      path: [],
      segments: [
        {
          durationSeconds: 120,
          endName: "강남역",
          kind: "walk",
          path: [
            { lat: 37.499, lng: 126.999 },
            { lat: 37.5, lng: 127 },
          ],
        },
        {
          kind: "subway",
          lineName: "2호선",
          color: "#00a84d",
          durationSeconds: 480,
          startName: "강남역",
          endName: "선릉역",
          path: [
            { lat: 37.5, lng: 127 },
            { lat: 37.51, lng: 127.01 },
          ],
        },
        {
          kind: "bus",
          lineName: "146",
          distanceMeters: 600,
          endName: "비타정류장",
          path: [
            { lat: 37.51, lng: 127.01 },
            { lat: 37.515, lng: 127.015 },
          ],
        },
      ],
    };

    expect(
      buildRouteSummary({
        isRouteLoading: false,
        routeDestinationStore: store,
        routeMode: "transit",
        userLocation: { lat: 37.5, lng: 127 },
        walkingRoute: route,
      }),
    ).toMatchObject({
      transitWalkTimeText: "약 2분",
      transitSteps: [
        {
          color: undefined,
          description: "강남역까지 도보 이동",
          id: "0:walk:",
          kind: "walk",
          lineName: "도보",
          meta: "약 2분",
        },
        {
          color: "#00a84d",
          description: "강남역에서 타고 선릉역에서 내려 이동",
          id: "1:subway:2호선",
          kind: "subway",
          lineName: "2호선",
          meta: "약 8분",
        },
        {
          color: undefined,
          description: "비타정류장에서 내려 이동",
          id: "2:bus:146",
          kind: "bus",
          lineName: "146",
          meta: "600m",
        },
      ],
    });
  });
});

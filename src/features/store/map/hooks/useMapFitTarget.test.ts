import { describe, expect, it } from "vitest";
import { buildMapFitPoints } from "@/features/store/map/hooks/useMapFitTarget";

describe("buildMapFitPoints", () => {
  const stores = [
    { lat: 37.5, lng: 127.1 },
    { lat: 37.51, lng: 127.11 },
  ];
  const userLocation = { lat: 37.49, lng: 127.09 };

  it("현재 위치와 매장 좌표를 함께 반환한다", () => {
    expect(buildMapFitPoints(stores, userLocation)).toEqual([
      userLocation,
      ...stores,
    ]);
  });

  it("현재 위치가 없으면 매장 좌표만 반환한다", () => {
    expect(buildMapFitPoints(stores, null)).toEqual(stores);
    expect(buildMapFitPoints(stores)).toEqual(stores);
  });

  it("빈 매장 목록이어도 현재 위치를 범위 계산에 포함한다", () => {
    expect(buildMapFitPoints([], userLocation)).toEqual([userLocation]);
  });
});

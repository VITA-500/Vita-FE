import { describe, expect, it } from "vitest";
import {
  buildMarkerLabelById,
  buildSearchableStores,
  getMapStoreVisibility,
  getSameLocationStores,
  getViewportAreaQuery,
  isStoreInVisibleArea,
  sortStoresByDistance,
  type MapViewport,
} from "@/features/store/lib/storePanelStores";
import type { StoreLocation } from "@/features/store/types";

const center = { lat: 37.5, lng: 127.0 };

const createStore = (
  id: string,
  lat: number,
  lng: number,
  overrides: Partial<StoreLocation> = {},
): StoreLocation => ({
  address: "",
  id,
  lat,
  lng,
  name: `매장 ${id}`,
  phone: "",
  ...overrides,
});

// 위도 0.001도 ≈ 111m
const near = createStore("near", 37.501, 127.0);
const middle = createStore("middle", 37.503, 127.0);
const far = createStore("far", 37.506, 127.0);

describe("buildSearchableStores", () => {
  it("merges stores by id, letting the loaded map stores win", () => {
    const pooled = createStore("a", 37.5, 127.0, { address: "풀 주소" });
    const loaded = createStore("a", 37.5, 127.0, { name: "지도 매장" });

    expect(buildSearchableStores([pooled], [loaded], null)).toEqual([
      { ...pooled, ...loaded },
    ]);
  });

  it("adds distance from the user location when it is known", () => {
    const [store] = buildSearchableStores([near], [], center);

    expect(store.distanceText).toBe("약 110m");
  });
});

describe("isStoreInVisibleArea", () => {
  const viewport: MapViewport = {
    center,
    northEast: { lat: 37.502, lng: 127.002 },
    southWest: { lat: 37.498, lng: 126.998 },
  };

  it("checks the visible map bounds when the viewport is known", () => {
    expect(isStoreInVisibleArea(near, viewport, center)).toBe(true);
    expect(isStoreInVisibleArea(middle, viewport, center)).toBe(false);
  });

  it("falls back to the search radius around the search center", () => {
    expect(isStoreInVisibleArea(far, null, center)).toBe(true);
    expect(
      isStoreInVisibleArea(createStore("x", 37.52, 127.0), null, center),
    ).toBe(false);
  });
});

describe("getViewportAreaQuery", () => {
  it("uses the search center and default radius without a viewport", () => {
    expect(getViewportAreaQuery(null, center)).toEqual({
      center,
      radiusKm: 1.5,
    });
  });

  it("clamps the radius between 0.3km and 3km", () => {
    const tiny: MapViewport = {
      center,
      northEast: { lat: 37.5001, lng: 127.0001 },
      southWest: { lat: 37.4999, lng: 126.9999 },
    };
    const huge: MapViewport = {
      center,
      northEast: { lat: 37.6, lng: 127.1 },
      southWest: { lat: 37.4, lng: 126.9 },
    };

    expect(getViewportAreaQuery(tiny, center).radiusKm).toBe(0.3);
    expect(getViewportAreaQuery(huge, center).radiusKm).toBe(3);
  });
});

describe("sortStoresByDistance", () => {
  it("sorts by distance from the origin and labels each distance", () => {
    const sorted = sortStoresByDistance([far, near, middle], center);

    expect(sorted.map((store) => store.id)).toEqual(["near", "middle", "far"]);
    expect(sorted.map((store) => store.distanceText)).toEqual([
      "약 110m",
      "약 330m",
      "약 670m",
    ]);
  });
});

describe("buildMarkerLabelById", () => {
  it("labels the page stores A, B, C… and the outside store with a dot", () => {
    expect(buildMarkerLabelById([near, middle], far)).toEqual({
      far: "•",
      middle: "B",
      near: "A",
    });
  });
});

describe("getMapStoreVisibility", () => {
  const mapStores = [near, middle, far];
  const pagedMapStores = [near, middle];

  it("shows the page pins and the rest as other stores", () => {
    expect(
      getMapStoreVisibility({
        mapStores,
        pagedMapStores,
        routeDestinationStoreId: "",
      }),
    ).toEqual({ otherMapStores: [far], visibleMapStores: [near, middle] });
  });

  it("adds a store selected outside the page to the pins", () => {
    expect(
      getMapStoreVisibility({
        mapStores,
        pagedMapStores,
        routeDestinationStoreId: "",
        selectedStoreOutsidePage: far,
      }),
    ).toEqual({ otherMapStores: [], visibleMapStores: [near, middle, far] });
  });

  it("shows only the route destination while navigating", () => {
    expect(
      getMapStoreVisibility({
        mapStores,
        pagedMapStores,
        routeDestinationStore: middle,
        routeDestinationStoreId: "middle",
      }),
    ).toEqual({ otherMapStores: [], visibleMapStores: [middle] });
  });

  it("shows only the solo store picked from the list", () => {
    expect(
      getMapStoreVisibility({
        mapStores,
        pagedMapStores,
        routeDestinationStoreId: "",
        soloStore: far,
      }),
    ).toEqual({ otherMapStores: [], visibleMapStores: [far] });
  });
});

describe("getSameLocationStores", () => {
  const twin = createStore("twin", 37.501, 127.0);

  it("returns stores at the same coordinate as the selected store", () => {
    expect(getSameLocationStores(near, [near, twin, far], [])).toEqual([
      near,
      twin,
    ]);
  });

  it("looks in all loaded stores when the selected store is not listed", () => {
    expect(getSameLocationStores(near, [far], [near, twin])).toEqual([
      near,
      twin,
    ]);
  });

  it("returns an empty list without a selected store", () => {
    expect(getSameLocationStores(undefined, [near], [near])).toEqual([]);
  });
});

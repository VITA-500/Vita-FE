import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import { storeService } from "./storeService";

vi.mock("@/shared/api/http", () => ({ requestJson: vi.fn() }));

const mockedRequestJson = vi.mocked(requestJson);

describe("storeService.fetchNearbyStores", () => {
  afterEach(() => {
    mockedRequestJson.mockReset();
  });

  it("maps businessHours from the nearby response", async () => {
    mockedRequestJson.mockResolvedValueOnce({
      stores: [
        {
          storeId: 12,
          name: "VITA 강남점",
          address: "서울 강남구 강남대로 396",
          phone: "02-0000-0001",
          lat: 37.498,
          lng: 127.027,
          distanceKm: 0.42,
          businessHours: "평일 10:00-20:00",
          consultServices: ["요금제 상담"],
          providedServices: ["유심 개통"],
        },
        {
          storeId: 13,
          name: "VITA 역삼점",
          lat: 37.5,
          lng: 127.03,
          distanceKm: 0.8,
          businessHours: null,
        },
      ],
    });

    const stores = await storeService.fetchNearbyStores(
      { lat: 37.498, lng: 127.027 },
      3,
    );

    expect(stores[0]).toMatchObject({
      id: "12",
      address: "서울 강남구 강남대로 396",
      phone: "02-0000-0001",
      businessHours: "평일 10:00-20:00",
      distanceText: expect.any(String),
    });
    expect(stores[1]).toMatchObject({ address: "", phone: "" });
    expect(stores[1].businessHours).toBeUndefined();
  });

  it("uses storeType from BE and sends the open-hours filter", async () => {
    mockedRequestJson.mockResolvedValueOnce({
      stores: [
        {
          storeId: 21,
          name: "제휴 카페",
          storeType: "PARTNER",
          lat: 37.5,
          lng: 127,
          distanceKm: 0.3,
          openNow: false,
          benefitDescription: "아메리카노 20% 할인",
        },
        {
          storeId: 22,
          name: "VITA 선릉점",
          lat: 37.5,
          lng: 127,
          distanceKm: 1,
        },
      ],
    });

    const stores = await storeService.fetchNearbyStores(
      { lat: 37.5, lng: 127 },
      3,
      { openFilter: { mode: "at", time: "18:00" } },
    );

    expect(mockedRequestJson.mock.calls[0][0]).toContain("openAt=18%3A00");
    expect(mockedRequestJson.mock.calls[0][0]).not.toContain("openNow");
    expect(stores[0]).toMatchObject({
      storeType: "PARTNER",
      openNow: false,
      benefitDescription: "아메리카노 20% 할인",
    });
    expect(stores[1].storeType).toBe("PHONE");
  });
});

describe("storeService.fetchStoreDetail", () => {
  afterEach(() => {
    mockedRequestJson.mockReset();
  });

  it("prefers benefit fields from the detail response", async () => {
    mockedRequestJson.mockResolvedValueOnce({
      storeId: 21,
      name: "제휴 카페",
      address: "서울 강남구",
      lat: 37.5,
      lng: 127,
      openNow: true,
      storeType: "PARTNER",
      benefitId: 3,
      brand: "카페브랜드",
      category: "카페",
      benefitName: "음료 할인",
    });

    const store = await storeService.fetchStoreDetail("21", {
      id: "21",
      name: "제휴 카페",
      address: "",
      phone: "",
      lat: 37.5,
      lng: 127,
      benefitDescription: "아메리카노 20% 할인",
    });

    expect(store).toMatchObject({
      benefitBrand: "카페브랜드",
      benefitCategory: "카페",
      benefitDescription: "아메리카노 20% 할인",
      benefitId: 3,
      benefitName: "음료 할인",
      openNow: true,
      storeType: "PARTNER",
    });
  });
});

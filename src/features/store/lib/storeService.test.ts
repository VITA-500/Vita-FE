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
});

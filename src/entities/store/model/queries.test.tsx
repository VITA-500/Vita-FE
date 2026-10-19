import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFetchStoreDetail } from "./queries";
import type { StoreLocation } from "./types";
import { requestJson } from "@/shared/api/http";

vi.mock("@/shared/api/http", () => ({ requestJson: vi.fn() }));

const mockedRequestJson = vi.mocked(requestJson);

const setup = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return renderHook(() => useFetchStoreDetail(), { wrapper }).result.current;
};

const listed = (distanceText: string): StoreLocation => ({
  address: "",
  distanceText,
  id: "12",
  lat: 37.5,
  lng: 127,
  name: "목록 매장",
  phone: "",
});

afterEach(() => mockedRequestJson.mockReset());

describe("useFetchStoreDetail", () => {
  it("상세 응답은 캐시하고, 목록 값(거리)은 부를 때마다 새로 합친다", async () => {
    mockedRequestJson.mockResolvedValue({
      address: "서울 강남구",
      businessHours: "10:00-20:00",
      lat: 37.5,
      lng: 127,
      name: "VITA 강남점",
      phone: "02-0000-0001",
      storeId: 12,
    });
    const fetchStoreDetail = setup();

    const first = await fetchStoreDetail("12", listed("약 300m"));
    const second = await fetchStoreDetail("12", listed("약 1.2km"));

    expect(mockedRequestJson).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({
      distanceText: "약 300m",
      name: "VITA 강남점",
    });
    // 이전 목록의 거리가 캐시에 남지 않는다.
    expect(second).toMatchObject({
      businessHours: "10:00-20:00",
      distanceText: "약 1.2km",
    });
  });

  it("API 매장 id가 아니면 요청 없이 목록 값을 돌려준다", async () => {
    const fetchStoreDetail = setup();
    const mockStore = { ...listed("약 100m"), id: "mock-1" };

    await expect(fetchStoreDetail("mock-1", mockStore)).resolves.toBe(
      mockStore,
    );
    expect(mockedRequestJson).not.toHaveBeenCalled();
  });
});

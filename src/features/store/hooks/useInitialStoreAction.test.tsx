import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInitialStoreAction } from "./useInitialStoreAction";

import type { StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/providers/ToastProvider";

// vi.mock은 파일 맨 위로 끌어올려지므로 모킹 함수도 vi.hoisted로 먼저 만든다.
const { fetchStoreDetail } = vi.hoisted(() => ({
  fetchStoreDetail:
    vi.fn<
      (
        storeId: string,
        fallback?: StoreLocation,
      ) => Promise<StoreLocation | null>
    >(),
}));

// 상세 조회 캐시(QueryClient)는 entities/store 테스트에서 확인하고, 여기서는 진입 흐름만 본다.
vi.mock("@/entities/store", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useFetchStoreDetail: () => fetchStoreDetail,
}));
vi.mock("@/shared/providers/ToastProvider", () => ({ showToast: vi.fn() }));

const listed: StoreLocation = {
  address: "목록 주소",
  id: "10",
  lat: 37.51,
  lng: 127.02,
  name: "목록 매장",
  phone: "",
};
const detail: StoreLocation = { ...listed, name: "상세 매장", phone: "02-1" };

const setup = (stores: StoreLocation[] = []) => {
  const params = {
    categoryDisplayStores: [],
    categoryStores: [],
    changeRouteMode: vi.fn(),
    handleRouteStart: vi.fn(),
    searchableStores: [],
    setActiveMapCategory: vi.fn(),
    setRouteReturnServices: vi.fn(),
    setSelectedBenefitCategory: vi.fn(),
    showStoreOnMap: vi.fn(),
    stores,
  };
  const { result } = renderHook(() => useInitialStoreAction(params));

  return { params, run: result.current.handleInitialStoreAction };
};

afterEach(() => vi.clearAllMocks());

describe("채팅 → 매장 지도 진입 (useInitialStoreAction)", () => {
  it("길찾기 진입: 상세로 지도에 보여 주고, 이동수단을 바꾼 뒤 길찾기를 시작한다", async () => {
    fetchStoreDetail.mockResolvedValue(detail);
    const { params, run } = setup([listed]);

    await run({
      action: "route",
      activeServices: ["유심 개통"],
      category: "store",
      routeMode: "transit",
      storeId: "10",
    });

    expect(fetchStoreDetail).toHaveBeenCalledWith("10", listed);
    expect(params.setRouteReturnServices).toHaveBeenCalledWith(["유심 개통"]);
    expect(params.showStoreOnMap).toHaveBeenCalledWith("10", detail, "store");
    expect(params.changeRouteMode).toHaveBeenCalledWith("transit");
    expect(params.handleRouteStart).toHaveBeenCalledWith(detail);
    expect(params.changeRouteMode.mock.invocationCallOrder[0]).toBeLessThan(
      params.handleRouteStart.mock.invocationCallOrder[0],
    );
  });

  it("상세 조회가 실패하면 목록에 있던 매장으로 길찾기를 시작한다", async () => {
    fetchStoreDetail.mockRejectedValue(new Error("timeout"));
    const { params, run } = setup([listed]);

    await run({ action: "route", storeId: "10" });

    expect(params.handleRouteStart).toHaveBeenCalledWith(listed);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("제휴 혜택에서 들어오면 제휴 매장으로 표시하고 혜택 카테고리를 채운다", async () => {
    fetchStoreDetail.mockResolvedValue(detail);
    const { params, run } = setup();

    await run({
      action: "select",
      benefitCategory: "카페",
      category: "benefit",
      storeId: "10",
    });

    expect(params.setActiveMapCategory).toHaveBeenCalledWith("benefit");
    expect(params.setSelectedBenefitCategory).toHaveBeenCalledWith("카페");
    expect(params.showStoreOnMap).toHaveBeenCalledWith(
      "10",
      { ...detail, benefitCategory: "카페", storeType: "PARTNER" },
      "benefit",
    );
    expect(params.handleRouteStart).not.toHaveBeenCalled();
  });

  it("상세도 목록도 없으면 안내만 하고 아무것도 시작하지 않는다", async () => {
    fetchStoreDetail.mockResolvedValue(null);
    const { params, run } = setup();

    await run({ action: "route", storeId: "99" });

    expect(showToast).toHaveBeenCalledWith("매장 정보를 불러오지 못했어요.");
    expect(params.showStoreOnMap).not.toHaveBeenCalled();
    expect(params.handleRouteStart).not.toHaveBeenCalled();
  });
});

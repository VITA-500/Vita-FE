import { describe, expect, it } from "vitest";
import {
  getMatchedServices,
  isStoreFindingPrompt,
  isStoreRelatedPrompt,
  rankStoresByServices,
  shouldUsePartnerStoreFallback,
  shouldUseLocalStoreFallback,
} from "@/features/chat/store/lib/chatStoreMap";

// 가까운 순으로 받은 매장
const stores = [
  { id: "a", consultServices: ["요금수납"], providedServices: [] },
  { id: "b", consultServices: ["휴대폰상담"], providedServices: ["주차 가능"] },
  { id: "c", consultServices: [], providedServices: [] },
  { id: "d", consultServices: ["휴대폰상담"], providedServices: [] },
];

describe("chatStoreMap", () => {
  it("finds the requested services a store provides", () => {
    expect(
      getMatchedServices(stores[1], ["휴대폰상담", "주차 가능", "로밍상담"]),
    ).toEqual(["휴대폰상담", "주차 가능"]);
  });

  it("puts stores with more requested services first and keeps distance order on ties", () => {
    const ranked = rankStoresByServices(stores, ["휴대폰상담", "주차 가능"]);

    expect(ranked.map((store) => store.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("keeps the original order without requested services", () => {
    expect(rankStoresByServices(stores, []).map((store) => store.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("keeps partner store prompts store-related so location can be sent", () => {
    expect(isStoreRelatedPrompt("근처 제휴 서비스 매장 찾아줘")).toBe(true);
  });

  it("recognizes partner brand and nearby expressions that need a location", () => {
    expect(isStoreRelatedPrompt("루나빈 어디 있어?")).toBe(true);
    expect(isStoreRelatedPrompt("가까이에 있는 카페 찾아줘")).toBe(true);
    expect(isStoreRelatedPrompt("인근 카페")).toBe(true);
  });

  it("does not request a location for a general benefit question", () => {
    expect(isStoreRelatedPrompt("제휴 혜택 뭐 있어?")).toBe(false);
  });

  it("does not create a local phone-store fallback for partner prompts", () => {
    expect(shouldUseLocalStoreFallback("근처 제휴 서비스 매장 찾아줘")).toBe(
      false,
    );
  });

  it("uses partner fallback when a partner prompt has no partner storeMap", () => {
    expect(
      shouldUsePartnerStoreFallback("근처 제휴 서비스 매장 찾아줘", {
        type: "PHONE",
        stores: [],
      }),
    ).toBe(true);
    expect(
      shouldUsePartnerStoreFallback("근처 제휴 서비스 매장 찾아줘", {
        type: "PARTNER",
        stores: [],
      }),
    ).toBe(false);
  });

  it("keeps BE phone-store maps when they include requested services", () => {
    expect(
      shouldUsePartnerStoreFallback("근처 제휴 서비스 매장 찾아줘", {
        type: "PHONE",
        activeServices: ["휴대폰상담"],
        stores: [
          {
            id: "1",
            name: "비타 강남점",
            address: "서울 강남구",
            phone: "02-1234-5678",
            lat: 37.5,
            lng: 127,
          },
        ],
      }),
    ).toBe(false);
  });

  it("allows local fallback for ordinary nearby store prompts", () => {
    expect(shouldUseLocalStoreFallback("근처 휴대폰 상담 매장 찾아줘")).toBe(
      true,
    );
  });
});

describe("isStoreFindingPrompt", () => {
  it("매장 위치를 찾는 질문만 매장 찾기로 본다", () => {
    expect(isStoreFindingPrompt("근처 매장 알려줘")).toBe(true);
    expect(isStoreFindingPrompt("가까운 대리점 어디야?")).toBe(true);
    expect(isStoreFindingPrompt("강남 지점 몇 시까지 해?")).toBe(true);
    expect(isStoreFindingPrompt("매장 추천해줘")).toBe(true);
    expect(isStoreFindingPrompt("인근 카페")).toBe(true);
    expect(isStoreFindingPrompt("부근 제휴 매장 알려줘")).toBe(true);
  });

  it("매장 관련 정보를 묻는 질문은 매장 찾기가 아니다", () => {
    expect(isStoreFindingPrompt("기기 변경 목적으로 매장 방문")).toBe(false);
    expect(isStoreFindingPrompt("매장 방문할 때 필요한 준비물 알려줘")).toBe(
      false,
    );
    expect(isStoreFindingPrompt("요금제 추천해줘")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  getMatchedServices,
  isStoreRelatedPrompt,
  rankStoresByServices,
  shouldUsePartnerStoreFallback,
  shouldUseLocalStoreFallback,
} from "@/features/chat/lib/chatStoreMap";

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

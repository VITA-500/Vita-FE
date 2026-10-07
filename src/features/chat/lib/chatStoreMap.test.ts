import { describe, expect, it } from "vitest";
import { getMatchedServices, rankStoresByServices } from "./chatStoreMap";

// 가까운 순으로 받은 매장
const stores = [
  { id: "a", consultServices: ["요금수납"], providedServices: [] },
  { id: "b", consultServices: ["휴대폰상담"], providedServices: ["주차 가능"] },
  { id: "c", consultServices: [], providedServices: [] },
  { id: "d", consultServices: ["휴대폰상담"], providedServices: [] },
];

describe("chat store ranking", () => {
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
});

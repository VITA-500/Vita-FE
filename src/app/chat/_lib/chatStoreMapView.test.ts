import { describe, expect, it } from "vitest";
import { toStoreLocation } from "./chatStoreMapView";
import type { ChatStoreMap } from "@/entities/chat";

const storeMap = {
  type: "PARTNER",
  category: "cafe",
  benefitId: 7,
  activeServices: [],
  stores: [{ id: "s1", name: "카페 강남점", lat: 37.5, lng: 127.03 }],
} as unknown as ChatStoreMap;

describe("toStoreLocation", () => {
  it("빈 주소·전화번호를 채우고 지도 데이터의 매장 종류·혜택을 매장에 붙인다", () => {
    expect(toStoreLocation(storeMap.stores[0], storeMap)).toMatchObject({
      id: "s1",
      address: "주소 정보 확인 중",
      phone: "",
      storeType: "PARTNER",
      benefitCategory: "cafe",
      benefitId: 7,
    });
  });
});

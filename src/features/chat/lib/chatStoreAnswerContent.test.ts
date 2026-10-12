import { describe, expect, it } from "vitest";
import type { ChatStoreMap } from "@/features/chat/types";
import { stripStoreTablesFromAnswer } from "./chatStoreAnswerContent";

const storeMap: ChatStoreMap = {
  stores: [
    {
      id: "1",
      name: "비타 강남점",
      address: "서울 강남구 테헤란로 1",
      phone: "02-1234-5678",
      lat: 37.5,
      lng: 127,
      distanceText: "320m",
    },
  ],
};

describe("stripStoreTablesFromAnswer", () => {
  it("removes a store table when store cards will render the same stores", () => {
    const content = [
      "현재 위치 기준 가까운 매장이에요.",
      "",
      "| 매장명 | 주소 | 거리 |",
      "| --- | --- | --- |",
      "| 비타 강남점 | 서울 강남구 테헤란로 1 | 320m |",
      "",
      "아래 카드에서 예약하거나 길찾기를 확인할 수 있어요.",
    ].join("\n");

    expect(stripStoreTablesFromAnswer(content, storeMap)).toBe(
      [
        "현재 위치 기준 가까운 매장이에요.",
        "",
        "아래 카드에서 예약하거나 길찾기를 확인할 수 있어요.",
      ].join("\n"),
    );
  });

  it("keeps non-store tables", () => {
    const content = [
      "| 요금제 | 월 요금 |",
      "| --- | --- |",
      "| 5G 심플 | 55,000원 |",
    ].join("\n");

    expect(stripStoreTablesFromAnswer(content, storeMap)).toBe(content);
  });

  it("removes store tables even when row wording does not match card data exactly", () => {
    const content = [
      "가까운 매장 목록이에요.",
      "",
      "| 순위 | 매장 | 영업 여부 |",
      "| --- | --- | --- |",
      "| 1 | 강남 인근 매장 | 영업 중 |",
    ].join("\n");

    expect(stripStoreTablesFromAnswer(content, storeMap)).toBe(
      "가까운 매장 목록이에요.",
    );
  });
});

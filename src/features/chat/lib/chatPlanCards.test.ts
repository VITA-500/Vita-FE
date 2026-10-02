import { describe, expect, it } from "vitest";
import { parseChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { blockToPlanCards } from "@/features/chat/lib/chatPlanCards";

const firstBlockCards = (markdown: string) =>
  blockToPlanCards(parseChatMarkdown(markdown)[0]);

describe("blockToPlanCards", () => {
  it("turns a plan comparison table into plan cards", () => {
    const cards = firstBlockCards(
      [
        "| 요금제 | 월 요금 | 데이터 |",
        "| --- | ---: | --- |",
        "| **비타 라이트 5** | 25000원 | 5GB |",
        "| 비타 밸런스 20 | 월 45,000원 | 20GB (추천) |",
      ].join("\n"),
    );

    expect(cards).toEqual([
      { planName: "비타 라이트 5", price: "25,000", features: ["데이터 5GB"] },
      {
        planName: "비타 밸런스 20",
        price: "45,000",
        features: ["데이터 20GB (추천)"],
        badge: "추천",
        highlighted: true,
      },
    ]);
  });

  it("turns a plan list with nested details into plan cards", () => {
    const cards = firstBlockCards(
      [
        "1. **비타 라이트 5** (월 25,000원)",
        "   - 데이터 5GB",
        "   - 소진 후 최대 400Kbps",
        "",
        "2. **비타 라이트 10**: 월 31,000원, 데이터 10GB",
      ].join("\n"),
    );

    expect(cards).toEqual([
      {
        planName: "비타 라이트 5",
        price: "25,000",
        features: ["데이터 5GB", "소진 후 최대 400Kbps"],
      },
      {
        planName: "비타 라이트 10",
        price: "31,000",
        features: ["데이터 10GB"],
      },
    ]);
  });

  it("keeps ordinary lists and tables as they are", () => {
    expect(
      firstBlockCards("- **결합 할인**: 최대 20,000원\n- 위약금 없음"),
    ).toBeNull();
    expect(
      firstBlockCards("| 항목 | 내용 |\n| --- | --- |\n| 준비물 | 신분증 |"),
    ).toBeNull();
  });
});

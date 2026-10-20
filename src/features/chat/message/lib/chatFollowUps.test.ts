import { describe, expect, it } from "vitest";
import { getChatFollowUp } from "@/features/chat/message/lib/chatFollowUps";
import type { ChatMessage, ChatStoreMap } from "@/entities/chat";

const answer = (extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "assistant-1",
  role: "assistant",
  content: "답변",
  createdAt: "2026-10-20T00:00:00.000Z",
  status: "success",
  ...extra,
});

const storeMap = {
  type: "PHONE",
  activeServices: [],
  stores: [{ id: "s1", name: "VITA 강남점", lat: 37.5, lng: 127.03 }],
} as unknown as ChatStoreMap;

describe("getChatFollowUp", () => {
  it("매장 지도가 있는 답변에는 방문 관련 제안을 붙인다", () => {
    const followUp = getChatFollowUp({
      answer: answer({ storeMap }),
      askedPrompts: ["근처 매장 알려줘"],
      question: "근처 매장 알려줘",
    });

    expect(followUp?.intro).toContain("방문 전에 이것도 도와드릴까요?");
    expect(followUp?.prompts).toContain("지금 영업 중인 매장만 알려줘");
  });

  it("요금제 카드가 두 개 이상이면 두 요금제 비교를 제안한다", () => {
    const followUp = getChatFollowUp({
      answer: answer({
        plans: [
          { name: "5G 프리미어", monthlyFee: 89000 },
          { name: "5G 스탠다드", monthlyFee: 69000 },
        ],
      }),
      askedPrompts: [],
      question: "5G 요금제 추천해줘",
    });

    expect(followUp?.prompts[0]).toBe(
      "5G 프리미어와 5G 스탠다드 차이를 비교해줘",
    );
  });

  it("데이터가 없으면 질문 내용(변경·가입)으로 매장 처리를 제안한다", () => {
    const followUp = getChatFollowUp({
      answer: answer(),
      askedPrompts: [],
      question: "요금제 변경하려면 어떻게 해?",
    });

    expect(followUp?.prompts).toEqual([
      "가까운 매장 찾아줘",
      "매장 방문할 때 필요한 준비물 알려줘",
    ]);
  });

  it("이미 물어본 질문은 다시 제안하지 않고, 남는 게 없으면 보여주지 않는다", () => {
    expect(
      getChatFollowUp({
        answer: answer(),
        askedPrompts: ["멤버십 혜택 알려줘", " 근처 제휴 매장 찾아줘 "],
        question: "멤버십 혜택 알려줘",
      }),
    ).toBeNull();
  });

  it("맞는 패턴이 없거나 실패한 답변이면 제안하지 않는다", () => {
    expect(
      getChatFollowUp({
        answer: answer(),
        askedPrompts: [],
        question: "안녕",
      }),
    ).toBeNull();
    expect(
      getChatFollowUp({
        answer: answer({ status: "error", storeMap }),
        askedPrompts: [],
        question: "근처 매장 알려줘",
      }),
    ).toBeNull();
  });

  it("자료가 없어 답하지 못한 답변에는 근처 매장 찾기를 제안한다", () => {
    const followUp = getChatFollowUp({
      answer: answer({
        content:
          "방문 시 필요한 준비물은 제가 확인할 수 있는 정보에 없어 정확히 안내드리기 어렵습니다.",
      }),
      askedPrompts: ["기기 변경 목적으로 매장 방문"],
      // 매장 질문이어도 적용한다.
      question: "기기 변경 목적으로 매장 방문",
    });

    expect(followUp?.intro).toContain("근처 매장을 찾아드릴까요?");
    expect(followUp?.prompts).toEqual(["근처 매장 찾아줘"]);
  });
});

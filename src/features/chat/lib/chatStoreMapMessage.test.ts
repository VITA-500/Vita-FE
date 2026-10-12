import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/features/chat/types";
import {
  normalizeStoreMapMessageForPrompt,
  shouldCacheStoreMapForPrompt,
} from "./chatStoreMapMessage";

const assistantMessage: ChatMessage = {
  id: "assistant-1",
  role: "assistant",
  content: [
    "가까운 제휴 매장이에요.",
    "",
    "| 제휴처 | 혜택 |",
    "| --- | --- |",
    "| 비타 강남점 | 음료 할인 |",
  ].join("\n"),
  createdAt: "2026-10-12T00:00:00.000Z",
  status: "success",
  actions: [{ label: "가까운 매장 보기", href: "/chat?mode=store" }],
  storeMap: {
    type: "PHONE",
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
  },
};

describe("chatStoreMapMessage", () => {
  it("hides phone store maps for partner benefit prompts", () => {
    expect(
      normalizeStoreMapMessageForPrompt(
        assistantMessage,
        "근처 제휴 서비스 매장 찾아줘",
      ),
    ).toMatchObject({
      content: "가까운 제휴 매장이에요.",
      actions: undefined,
      storeMap: undefined,
    });
  });

  it("does not cache mismatched phone maps for partner prompts", () => {
    expect(
      shouldCacheStoreMapForPrompt(
        "근처 제휴 서비스 매장 찾아줘",
        assistantMessage.storeMap,
      ),
    ).toBe(false);
  });

  it("keeps partner cards and removes location missing text", () => {
    expect(
      normalizeStoreMapMessageForPrompt(
        {
          ...assistantMessage,
          content: [
            "고객님의 위치 정보가 없어서 가까운 매장을 안내드릴 수 없어요.",
            "",
            "| 제휴처 | 혜택 |",
            "| --- | --- |",
            "| 비타 강남점 | 음료 할인 |",
            "",
            "아래 카드에서 확인해 주세요.",
          ].join("\n"),
          storeMap: { ...assistantMessage.storeMap!, type: "PARTNER" },
        },
        "근처 제휴 서비스 매장 찾아줘",
      ),
    ).toMatchObject({
      content: "아래 카드에서 확인해 주세요.",
      storeMap: { type: "PARTNER" },
    });
  });
});

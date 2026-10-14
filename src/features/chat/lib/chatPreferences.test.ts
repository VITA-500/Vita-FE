import { describe, expect, it } from "vitest";
import {
  defaultChatPreferences,
  normalizeChatPreferences,
} from "@/features/chat/lib/chatPreferences";

describe("chatPreferences", () => {
  it("keeps supported preference values", () => {
    expect(
      normalizeChatPreferences({
        answerTone: "detailed",
        interestedTopics: ["요금제", "매장"],
        useLocationContext: false,
      }),
    ).toEqual({
      answerTone: "detailed",
      interestedTopics: ["요금제", "매장"],
      useLocationContext: false,
    });
  });

  it("falls back when saved preferences are malformed", () => {
    expect(
      normalizeChatPreferences({
        answerTone: "long" as never,
        interestedTopics: ["요금제", "없는 분야"],
        useLocationContext: "yes" as never,
      }),
    ).toEqual({
      answerTone: defaultChatPreferences.answerTone,
      interestedTopics: ["요금제"],
      useLocationContext: defaultChatPreferences.useLocationContext,
    });
  });
});

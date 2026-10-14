import { describe, expect, it } from "vitest";
import {
  defaultChatPreferences,
  normalizeChatPreferences,
} from "@/features/chat/lib/chatPreferences";

describe("chatPreferences", () => {
  it("keeps supported preference values", () => {
    expect(
      normalizeChatPreferences({
        usePreviousConsultation: true,
        historyPreference: "auto_apply",
      }),
    ).toEqual({
      usePreviousConsultation: true,
      historyPreference: "auto_apply",
    });
  });

  it("falls back when saved preferences are malformed", () => {
    expect(
      normalizeChatPreferences({
        usePreviousConsultation: "yes" as never,
        historyPreference: "always" as never,
      }),
    ).toEqual(defaultChatPreferences);
  });

  it("falls back when old answer preference values are saved", () => {
    expect(
      normalizeChatPreferences({
        answerFormat: "detailed",
        enabled: true,
        useThreeLineSummary: true,
      } as never),
    ).toEqual(defaultChatPreferences);
  });
});

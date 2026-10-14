import { describe, expect, it } from "vitest";
import {
  defaultChatClientSettings,
  moveQuickAction,
  normalizeChatClientSettings,
  toggleQuickAction,
} from "@/features/chat/lib/chatClientSettings";

describe("chatClientSettings", () => {
  it("falls back to defaults when saved settings are malformed", () => {
    expect(
      normalizeChatClientSettings({
        quickActionIds: "all" as never,
      }),
    ).toEqual(defaultChatClientSettings);
  });

  it("keeps known quick actions once, in saved order", () => {
    expect(
      normalizeChatClientSettings({
        quickActionIds: [
          "nearby_store",
          "unknown" as never,
          "change_plan",
          "nearby_store",
        ],
      }).quickActionIds,
    ).toEqual(["nearby_store", "change_plan"]);
  });

  it("allows hiding every quick action", () => {
    expect(
      normalizeChatClientSettings({ quickActionIds: [] }).quickActionIds,
    ).toEqual([]);
  });

  it("puts a re-enabled quick action back in its original slot", () => {
    expect(
      toggleQuickAction(["consult_summary", "change_plan"], "nearby_store"),
    ).toEqual(["change_plan", "nearby_store", "consult_summary"]);
    expect(
      toggleQuickAction(["change_plan", "nearby_store"], "change_plan"),
    ).toEqual(["nearby_store"]);
  });

  it("moves a quick action one step and stops at the edges", () => {
    const ids = ["change_plan", "nearby_store", "partner_benefit"] as const;

    expect(moveQuickAction(ids, "nearby_store", -1)).toEqual([
      "nearby_store",
      "change_plan",
      "partner_benefit",
    ]);
    expect(moveQuickAction(ids, "partner_benefit", 1)).toEqual([...ids]);
  });
});

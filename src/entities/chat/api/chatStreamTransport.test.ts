import { describe, expect, it } from "vitest";
import { parseStreamEvent } from "./chatStreamTransport";
import {
  toChatPlan,
  toChatStoreMap,
} from "@/entities/chat/model/chatResponseAdapters";
import type { ChatApiPlan, ChatApiStoreMap } from "./apiTypes";

describe("chat stream contract", () => {
  it("ignores unknown events, invalid JSON, IDs and delta payloads", () => {
    for (const event of [
      { event: "assistant_delta", data: "{" },
      {
        event: "assistant_delta",
        data: JSON.stringify({ sessionId: "1", messageId: 2, delta: "x" }),
      },
      {
        event: "assistant_delta",
        data: JSON.stringify({ sessionId: 1, messageId: 2, delta: 3 }),
      },
      {
        event: "assistant_status",
        data: JSON.stringify({ sessionId: 1, messageId: 2, status: "done" }),
      },
      { event: "expired", data: "{}" },
    ])
      expect(parseStreamEvent(event)).toBeNull();
  });
  it("accepts the three BE stages", () => {
    for (const status of ["thinking", "retrieving_faq", "generating"]) {
      expect(
        parseStreamEvent({
          event: "assistant_status",
          data: JSON.stringify({ sessionId: 1, messageId: 2, status }),
        }),
      ).toMatchObject({ payload: { status } });
    }
  });
  it("normalizes nullable server cards without changing location or map origin", () => {
    const map = {
      type: "PARTNER",
      originSource: "place",
      origin: { lat: 1, lng: 2 },
      stores: [
        {
          id: "1",
          name: "매장",
          address: "주소",
          lat: 1,
          lng: 2,
          phone: null,
          openNow: null,
          consultServices: null,
        },
      ],
    } as ChatApiStoreMap;
    expect(toChatStoreMap(map)).toMatchObject({
      originSource: "place",
      stores: [{ id: "1", phone: "" }],
    });
    expect(toChatStoreMap(map)?.stores[0].openNow).toBeUndefined();
    expect(
      toChatPlan({
        name: "요금제",
        monthlyFee: 100,
        summary: null,
      } as ChatApiPlan),
    ).toEqual({ name: "요금제", monthlyFee: 100 });
  });
});

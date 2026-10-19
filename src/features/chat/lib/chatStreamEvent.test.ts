import { describe, expect, it } from "vitest";
import { parseStreamEvent } from "./chatStreamEvent";

const event = (payload: object) => ({
  event: "assistant_done",
  data: JSON.stringify({
    sessionId: 1,
    messageId: 2,
    content: "답변",
    ...payload,
  }),
});

describe("chat completion event boundary", () => {
  it("keeps nullable cards and extra server fields intact", () => {
    const input = event({
      actions: null,
      plans: [],
      storeMap: null,
      extra: true,
    });
    expect(parseStreamEvent(input)).toEqual({
      name: "assistant_done",
      payload: JSON.parse(input.data),
    });
  });

  it.each([
    { actions: [null] },
    { actions: [{ label: "상세", href: 1 }] },
    { plans: [{ name: "요금제", monthlyFee: "100" }] },
    { storeMap: { stores: [{ id: "1", name: "매장", lat: "1", lng: 2 }] } },
  ])("ignores malformed card payloads: %j", (payload) => {
    expect(parseStreamEvent(event(payload))).toBeNull();
  });

  it("accepts terminal errors without transport dependencies", () => {
    expect(
      parseStreamEvent({
        event: "assistant_error",
        data: JSON.stringify({
          sessionId: 1,
          messageId: 2,
          code: "FAILED",
          message: "실패",
        }),
      }),
    ).toMatchObject({ name: "assistant_error", payload: { code: "FAILED" } });
  });
});

import { describe, expect, it } from "vitest";
import {
  FAILED_ANSWER_MESSAGE,
  toAssistantMessage,
  type ChatMessageResponse,
} from "@/features/chat/lib/chatAnswerMessage";

const response = (
  overrides: Partial<ChatMessageResponse> = {},
): ChatMessageResponse => ({
  answer: "응답",
  createAt: "2026-10-07T00:00:00.000Z",
  latencyMs: 10,
  messageId: 1,
  relatedFaqIds: [],
  status: "COMPLETED",
  ...overrides,
});

describe("chatAnswerMessage", () => {
  it("maps completed answers to successful assistant messages", () => {
    expect(toAssistantMessage(response())).toMatchObject({
      id: "assistant-1",
      role: "assistant",
      content: "응답",
      status: "success",
    });
  });

  it("shows a failure guide when the answer is empty", () => {
    expect(
      toAssistantMessage(response({ answer: null, status: "FAILED" })),
    ).toMatchObject({
      content: FAILED_ANSWER_MESSAGE,
      status: "error",
    });
  });

  it("normalizes nearby store payloads into storeMap", () => {
    expect(
      toAssistantMessage(
        response({
          nearbyStores: [
            {
              id: "1",
              name: "비타 강남점",
              address: "서울 강남구",
              phone: "02-1234-5678",
              lat: 37.5,
              lng: 127,
            },
          ],
        }),
      ).storeMap?.stores,
    ).toHaveLength(1);
  });

  it("keeps BE storeMap and actions on the assistant message", () => {
    expect(
      toAssistantMessage(
        response({
          storeMap: {
            type: "PARTNER",
            category: "CAFE",
            benefitId: 12,
            stores: [],
          },
          actions: [{ label: "가까운 매장 보기", href: "/chat?mode=store" }],
        }),
      ),
    ).toMatchObject({
      storeMap: { type: "PARTNER", category: "CAFE", benefitId: 12 },
      actions: [{ label: "가까운 매장 보기", href: "/chat?mode=store" }],
    });
  });
});

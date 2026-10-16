import { describe, expect, it } from "vitest";
import {
  FAILED_ANSWER_MESSAGE,
  toAssistantMessage,
} from "@/features/chat/lib/chatAnswerMessage";

const response = (
  overrides: Partial<Parameters<typeof toAssistantMessage>[0]> = {},
): Parameters<typeof toAssistantMessage>[0] => ({
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

  it("does not expose cards or actions on a failed answer", () => {
    expect(
      toAssistantMessage(
        response({
          status: "FAILED",
          storeMap: { stores: [] },
          actions: [{ label: "매장", href: "/chat?mode=store" }],
        }),
      ),
    ).toMatchObject({
      status: "error",
      storeMap: undefined,
      actions: undefined,
    });
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

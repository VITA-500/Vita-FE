import { describe, expect, it } from "vitest";
import { canSendAnswerFeedback } from "@/features/chat/message/lib/chatAnswerFeedback";
import type { ChatMessage } from "@/features/chat/types";

const answer = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "assistant-10",
  role: "assistant",
  content: "요금제 변경은 마이페이지에서 할 수 있어요.",
  createdAt: "2026-10-13T10:00:00",
  status: "success",
  serverMessageId: 10,
  ...overrides,
});

describe("chatAnswerFeedback", () => {
  it("allows reporting only saved, successful answers", () => {
    expect(canSendAnswerFeedback(answer())).toBe(true);
    expect(canSendAnswerFeedback(answer({ status: undefined }))).toBe(true);
    expect(canSendAnswerFeedback(answer({ status: "error" }))).toBe(false);
    expect(canSendAnswerFeedback(answer({ status: "stopped" }))).toBe(false);
    expect(canSendAnswerFeedback(answer({ serverMessageId: undefined }))).toBe(
      false,
    );
    expect(canSendAnswerFeedback(answer({ role: "user" }))).toBe(false);
  });
});

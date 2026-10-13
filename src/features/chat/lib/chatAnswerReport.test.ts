import { describe, expect, it } from "vitest";
import { canReportAnswer } from "@/features/chat/lib/chatAnswerReport";
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

describe("chatAnswerReport", () => {
  it("allows reporting only saved, successful answers", () => {
    expect(canReportAnswer(answer())).toBe(true);
    expect(canReportAnswer(answer({ status: undefined }))).toBe(true);
    expect(canReportAnswer(answer({ status: "error" }))).toBe(false);
    expect(canReportAnswer(answer({ status: "stopped" }))).toBe(false);
    expect(canReportAnswer(answer({ serverMessageId: undefined }))).toBe(false);
    expect(canReportAnswer(answer({ role: "user" }))).toBe(false);
  });
});

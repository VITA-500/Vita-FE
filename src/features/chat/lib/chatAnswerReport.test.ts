import { describe, expect, it } from "vitest";
import {
  canReportAnswer,
  isUnresolvedAnswer,
} from "@/features/chat/lib/chatAnswerReport";
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
  it("treats the no-context answer phrase as unresolved", () => {
    expect(
      isUnresolvedAnswer(
        answer({
          content: "해당 정보는 확인이 어렵습니다. 고객센터로 문의해주세요.",
        }),
      ),
    ).toBe(true);
    expect(isUnresolvedAnswer(answer())).toBe(false);
  });

  it("does not treat user messages as unresolved answers", () => {
    expect(
      isUnresolvedAnswer(
        answer({ role: "user", content: "해당 정보는 확인이 어렵습니다" }),
      ),
    ).toBe(false);
  });

  it("allows reporting only saved, successful answers", () => {
    expect(canReportAnswer(answer())).toBe(true);
    expect(canReportAnswer(answer({ status: undefined }))).toBe(true);
    expect(canReportAnswer(answer({ status: "error" }))).toBe(false);
    expect(canReportAnswer(answer({ status: "stopped" }))).toBe(false);
    expect(canReportAnswer(answer({ serverMessageId: undefined }))).toBe(false);
    expect(canReportAnswer(answer({ role: "user" }))).toBe(false);
  });
});

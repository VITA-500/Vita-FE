import { describe, expect, it } from "vitest";
import {
  findUserMessageBeforeAssistant,
  getLastUserMessage,
} from "@/features/chat/lib/chatConversationFlow";
import type { ChatMessage } from "@/features/chat/types";

const message = (
  id: string,
  role: ChatMessage["role"],
  content = id,
): ChatMessage => ({
  id,
  role,
  content,
  createdAt: "2026-10-07T00:00:00.000Z",
});

describe("chatConversationFlow", () => {
  it("finds the user prompt that produced an assistant answer", () => {
    const messages = [
      message("user-1", "user", "첫 질문"),
      message("assistant-1", "assistant", "첫 답변"),
      message("user-2", "user", "다시 질문"),
      message("assistant-2", "assistant", "실패 답변"),
    ];

    expect(
      findUserMessageBeforeAssistant(messages, "assistant-2")?.content,
    ).toBe("다시 질문");
  });

  it("returns undefined when the assistant answer is missing", () => {
    expect(
      findUserMessageBeforeAssistant([message("user-1", "user")], "missing"),
    ).toBeUndefined();
  });

  it("finds the latest user message for stop hints", () => {
    expect(
      getLastUserMessage([
        message("user-1", "user"),
        message("assistant-1", "assistant"),
        message("user-2", "user"),
      ])?.id,
    ).toBe("user-2");
  });
});

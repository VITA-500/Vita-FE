import { describe, expect, it } from "vitest";
import {
  collapseRetriedFailures,
  dropTrailingFailedAttempts,
  findUserMessageBeforeAssistant,
  getLastUserMessage,
} from "@/features/chat/conversation/lib/chatConversationFlow";
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

  it("drops every trailing failed attempt of the same prompt before retrying", () => {
    const failed = (id: string): ChatMessage => ({
      ...message(id, "assistant", "실패"),
      status: "error",
    });
    const messages = [
      message("user-1", "user", "첫 질문"),
      message("assistant-1", "assistant", "첫 답변"),
      message("user-2", "user", "매장 알려줘"),
      failed("assistant-2"),
      message("user-3", "user", " 매장 알려줘 "),
      failed("assistant-3"),
    ];

    expect(
      dropTrailingFailedAttempts(messages, "매장 알려줘").map(({ id }) => id),
    ).toEqual(["user-1", "assistant-1"]);
    // 다른 질문의 실패는 지우지 않는다.
    expect(dropTrailingFailedAttempts(messages, "다른 질문")).toHaveLength(6);
  });

  it("hides failed attempts that were retried with the same prompt in saved history", () => {
    const failed = (id: string): ChatMessage => ({
      ...message(id, "assistant", "실패"),
      status: "error",
    });
    const messages = [
      message("user-1", "user", "매장 알려줘"),
      failed("assistant-1"),
      message("user-2", "user", "매장 알려줘"),
      failed("assistant-2"),
      message("user-3", "user", "매장 알려줘"),
      message("assistant-3", "assistant", "근처 매장이에요"),
      message("user-4", "user", "요금제 알려줘"),
      failed("assistant-4"),
    ];

    expect(collapseRetriedFailures(messages).map(({ id }) => id)).toEqual([
      "user-3",
      "assistant-3",
      // 다시 시도하지 않은 마지막 실패는 그대로 보여 준다.
      "user-4",
      "assistant-4",
    ]);
  });
});

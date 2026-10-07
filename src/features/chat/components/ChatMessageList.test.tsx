import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/features/chat/types";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";

const userMessage: ChatMessage = {
  id: "user-1",
  role: "user",
  content: "요금제 추천해줘",
  createdAt: "2026-10-07T00:00:00.000Z",
};

const assistant = (
  status: ChatMessage["status"],
  content = "",
): ChatMessage => ({
  id: `assistant-${status}`,
  role: "assistant",
  content,
  status,
  createdAt: "2026-10-07T00:00:01.000Z",
});

describe("ChatMessageList answer status", () => {
  it("shows an error block with a retry button on the last failed answer", async () => {
    const user = userEvent.setup();
    const onRetryAnswer = vi.fn();

    render(
      <ChatMessageList
        isLoading={false}
        messages={[
          userMessage,
          assistant("error", "답변을 생성하지 못했어요."),
        ]}
        onRetryAnswer={onRetryAnswer}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("답변을 받지 못했어요");
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetryAnswer).toHaveBeenCalledWith("assistant-error");
  });

  it("does not offer retry for an earlier failed answer", () => {
    render(
      <ChatMessageList
        isLoading={false}
        messages={[
          userMessage,
          assistant("error", "실패"),
          { ...userMessage, id: "user-2" },
          { ...assistant("success", "정상 답변"), id: "assistant-2" },
        ]}
        onRetryAnswer={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "다시 시도" }),
    ).not.toBeInTheDocument();
  });

  it("lets the user edit a stopped question and resend it", async () => {
    const user = userEvent.setup();
    const onEditPrompt = vi.fn();

    render(
      <ChatMessageList
        editHintMessageId="user-1"
        isLoading={false}
        messages={[userMessage, assistant("stopped", "추천 요금제는")]}
        onEditPrompt={onEditPrompt}
      />,
    );

    expect(screen.getByText(/답변 생성을 중단했어요/)).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("질문 수정");

    await user.click(screen.getByRole("button", { name: "질문 수정" }));
    const textarea = screen.getByRole("textbox", { name: "질문 수정" });

    await user.clear(textarea);
    await user.type(textarea, "5G 요금제 추천해줘");
    await user.click(screen.getByRole("button", { name: "다시 보내기" }));

    expect(onEditPrompt).toHaveBeenCalledWith("user-1", "5G 요금제 추천해줘");
  });

  it("hides the edit button while another answer is loading", () => {
    render(
      <ChatMessageList
        isLoading
        messages={[userMessage, assistant("stopped")]}
        onEditPrompt={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "질문 수정" }),
    ).not.toBeInTheDocument();
  });
});

describe("ChatComposer stop button", () => {
  it("swaps the send button for a stop button while loading", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    render(
      <ChatComposer
        isLoading
        value=""
        onChange={vi.fn()}
        onStop={onStop}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "메시지 보내기" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "답변 중단" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});

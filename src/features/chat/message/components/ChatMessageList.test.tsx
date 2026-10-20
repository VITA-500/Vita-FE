import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "@/features/chat/conversation/components/ChatComposer";
import { ChatMessageList } from "@/features/chat/message/components/ChatMessageList";
import type { ChatMessage } from "@/entities/chat";

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
  it("resends a stopped question without opening the editor", async () => {
    const onRetryAnswer = vi.fn();
    const onEditPrompt = vi.fn();
    render(
      <ChatMessageList
        isLoading={false}
        messages={[userMessage, assistant("stopped", "부분 답변")]}
        onRetryAnswer={onRetryAnswer}
        onEditPrompt={onEditPrompt}
      />,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "다시 보내기" }));
    expect(onRetryAnswer).toHaveBeenCalledExactlyOnceWith("assistant-stopped");
    expect(onEditPrompt).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "질문 수정" }),
    ).not.toBeInTheDocument();
  });

  it("does not offer resend for an earlier stopped answer or while loading", () => {
    const { rerender } = render(
      <ChatMessageList
        isLoading={false}
        messages={[
          userMessage,
          assistant("stopped"),
          { ...userMessage, id: "user-2" },
        ]}
        onRetryAnswer={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "다시 보내기" }),
    ).not.toBeInTheDocument();
    rerender(
      <ChatMessageList
        isLoading
        messages={[userMessage, assistant("stopped")]}
        onRetryAnswer={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "다시 보내기" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error block with a retry button on the last failed answer", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
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

  it("offers follow-up prompts only under the last answer and sends the chosen one", async () => {
    const onSelectFollowUp = vi.fn();
    const question: ChatMessage = {
      id: "user-change",
      role: "user",
      content: "요금제 변경하려면 어떻게 해?",
      createdAt: "2026-10-20T00:00:00.000Z",
    };
    const answer: ChatMessage = {
      id: "assistant-change",
      role: "assistant",
      content: "온라인에서 변경할 수 있어요.",
      status: "success",
      createdAt: "2026-10-20T00:00:01.000Z",
    };
    const { rerender } = render(
      <ChatMessageList
        isLoading={false}
        messages={[question, answer]}
        onSelectFollowUp={onSelectFollowUp}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "가까운 매장 찾아줘" }),
    );
    expect(onSelectFollowUp).toHaveBeenCalledWith("가까운 매장 찾아줘");

    rerender(
      <ChatMessageList
        isLoading
        messages={[question, answer]}
        onSelectFollowUp={onSelectFollowUp}
      />,
    );
    expect(
      screen.queryByRole("region", { name: "이어서 물어볼 만한 질문" }),
    ).toBeNull();
  });

  it("turns the choices of a clarifying question into buttons and sends the picked item with the question", async () => {
    const onSelectFollowUp = vi.fn();
    const question: ChatMessage = {
      id: "user-visit",
      role: "user",
      content: "매장 방문할 때 필요한 준비물 알려줘",
      createdAt: "2026-10-20T00:00:00.000Z",
    };
    const answer: ChatMessage = {
      id: "assistant-visit",
      role: "assistant",
      content: [
        "어떤 목적으로 매장을 방문하실 예정인지 알려주시면 필요한 준비물을 안내드릴게요!",
        "",
        "* 기기변경",
        "* 해지",
        "* 기타 문의",
      ].join("\n"),
      status: "success",
      createdAt: "2026-10-20T00:00:01.000Z",
    };
    render(
      <ChatMessageList
        isLoading={false}
        messages={[question, answer]}
        onSelectFollowUp={onSelectFollowUp}
      />,
    );

    const choices = screen.getByRole("group", { name: "답변을 이어갈 선택지" });
    expect(choices.textContent).toContain(
      "그 밖의 내용은 아래 입력창에 적어 주세요.",
    );
    // 목록 글은 버튼으로 바뀌어 한 번만 보인다.
    expect(screen.getAllByText("기기변경")).toHaveLength(1);
    // 되묻는 중에는 후속 제안을 같이 보여주지 않는다.
    expect(
      screen.queryByRole("region", { name: "이어서 물어볼 만한 질문" }),
    ).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "기기변경" }));
    // 원래 질문과 합쳐 보내 BE가 자료를 찾기 쉽게 한다.
    expect(onSelectFollowUp).toHaveBeenCalledWith(
      "기기변경의 경우, 매장 방문할 때 필요한 준비물 알려줘",
    );
  });
});

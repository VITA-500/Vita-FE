import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatPromptSubmit } from "@/features/chat/conversation/hooks/useChatPromptSubmit";
import { chatApi } from "@/entities/chat";
import { ApiError } from "@/shared/api/http";

vi.mock("@/entities/chat", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/chat")>()),
  chatApi: { createSession: vi.fn(), sendMessage: vi.fn() },
}));
vi.mock("@/features/chat/conversation/lib/chatTextReveal", () => ({
  createTextReveal: () => ({
    push: vi.fn(),
    finish: async () => {},
    cancel: vi.fn(),
  }),
}));
vi.mock("@/shared/providers/ToastProvider", () => ({ showToast: vi.fn() }));

const setup = (currentSessionId?: number) => {
  const params = {
    answerAbortRef: { current: null as AbortController | null },
    chatInput: "",
    chatInputRef: { current: null },
    chatStatus: "idle" as const,
    clearEditHint: vi.fn(),
    currentChatTitle: "",
    currentGuestId: "guest",
    currentSessionId,
    focusChatInput: vi.fn(),
    hasUser: false,
    isAuthenticated: false,
    refreshChatSessions: vi.fn(),
    setChatInput: vi.fn(),
    setChatStatus: vi.fn(),
    setConversationStatus: vi.fn(),
    setCurrentChatTitle: vi.fn(),
    setCurrentGuestId: vi.fn(),
    setCurrentSessionId: vi.fn(),
    setMessages: vi.fn(),
    setSessionTitles: vi.fn(),
    setStreamingReply: vi.fn(),
  };
  return { params, ...renderHook(() => useChatPromptSubmit(params)) };
};
afterEach(() => vi.clearAllMocks());

describe("chat prompt lifecycle", () => {
  it("creates a server session and transitions through BE stages to done", async () => {
    vi.mocked(chatApi.createSession).mockResolvedValue({
      sessionId: 42,
      createdAt: "now",
    });
    vi.mocked(chatApi.sendMessage).mockImplementation(async (options) => {
      options.onStage?.("understanding");
      options.onStage?.("retrieving");
      options.onStage?.("generating");
      options.onDelta?.("답변");
      return {
        id: "assistant-1",
        role: "assistant",
        content: "답변",
        createdAt: "now",
        status: "success",
      };
    });
    const { params, result } = setup();
    await act(async () => {
      await result.current("질문");
    });
    expect(params.setCurrentSessionId).toHaveBeenCalledWith(42);
    expect(chatApi.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 42,
        guestId: "guest",
        content: "질문",
      }),
    );
    expect(
      params.setConversationStatus.mock.calls.map(([status]) => status),
    ).toEqual([
      "loading",
      "thinking",
      "retrieving_faq",
      "generating",
      "generating",
      "done",
    ]);
    expect(params.setChatStatus).toHaveBeenLastCalledWith("idle");
  });
  it("reuses numeric session IDs and resets an expired session for the next attempt", async () => {
    vi.mocked(chatApi.sendMessage).mockRejectedValue(
      new ApiError("", 401, { code: "UNAUTHORIZED" }),
    );
    const { params, result } = setup(42);
    await act(async () => {
      await result.current("질문");
    });
    expect(chatApi.createSession).not.toHaveBeenCalled();
    expect(params.setConversationStatus).toHaveBeenLastCalledWith("expired");
    expect(params.setCurrentSessionId).toHaveBeenCalledWith(undefined);
    const update = params.setMessages.mock.calls.at(-1)?.[0];
    expect(update([])).toMatchObject([
      { status: "error", content: expect.stringContaining("만료") },
    ]);
  });
  it("does not append a late answer after a stop or conversation change", async () => {
    let complete!: (
      message: Awaited<ReturnType<typeof chatApi.sendMessage>>,
    ) => void;
    vi.mocked(chatApi.sendMessage).mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { params, result } = setup(42);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current("질문");
    });
    const before = params.setMessages.mock.calls.length;
    await act(async () => {
      params.answerAbortRef.current?.abort();
      complete({
        id: "assistant-1",
        role: "assistant",
        content: "늦은 답변",
        createdAt: "now",
      });
      await pending;
    });
    expect(params.setMessages).toHaveBeenCalledTimes(before);
  });
});

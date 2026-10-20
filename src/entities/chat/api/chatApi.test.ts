import { afterEach, describe, expect, it, vi } from "vitest";
import { FAILED_ANSWER_MESSAGE } from "@/entities/chat/model/chatAnswerMessage";
import { chatApi } from "./chatApi";

const encoder = new TextEncoder();

/** 테스트에서 이벤트를 원하는 시점에 흘려보낼 수 있는 SSE 응답 */
const createSseResponse = () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
  });

  return {
    response: new Response(body, {
      headers: { "Content-Type": "text/event-stream" },
      status: 200,
    }),
    send: (event: string, data: unknown) =>
      controller.enqueue(
        encoder.encode(
          `event:${event}\ndata:${typeof data === "string" ? data : JSON.stringify(data)}\n\n`,
        ),
      ),
    close: () => controller.close(),
  };
};

const pendingResponse = (messageId: number) =>
  new Response(
    JSON.stringify({
      messageId,
      status: "PENDING",
      answer: null,
      relatedFaqIds: [],
      createAt: "2026-10-06T10:00:00",
      latencyMs: 12,
    }),
    { status: 200 },
  );

describe("chatApi.sendMessage (SSE)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("subscribes before sending and builds the answer from stream events", async () => {
    const sse = createSseResponse();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/events")) {
        queueMicrotask(() => sse.send("connected", "ok"));
        return Promise.resolve(sse.response);
      }

      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        content: "근처 매장 찾아줘",
        lat: 37.5,
        lng: 127.03,
      });
      // POST 응답보다 이벤트가 먼저 와도 놓치지 않아야 한다.
      sse.send("assistant_status", {
        sessionId: 3,
        messageId: 7,
        status: "retrieving_faq",
      });
      sse.send("assistant_delta", {
        sessionId: 3,
        messageId: 6,
        delta: "다른 메시지",
      });
      sse.send("assistant_delta", {
        sessionId: 3,
        messageId: 7,
        delta: "요금제는 ",
      });

      setTimeout(() => {
        sse.send("assistant_delta", {
          sessionId: 3,
          messageId: 7,
          delta: "변경할 수 있어요.",
        });
        sse.send("assistant_done", {
          sessionId: 3,
          messageId: 7,
          content: "요금제는 변경할 수 있어요.",
          storeMap: {
            type: "PHONE",
            activeServices: ["휴대폰상담"],
            stores: [],
          },
          actions: [{ label: "가까운 매장 보기", href: "/chat?mode=store" }],
        });
      }, 0);

      return Promise.resolve(pendingResponse(7));
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const onStage = vi.fn();
    const onDelta = vi.fn();
    const message = await chatApi.sendMessage({
      content: "근처 매장 찾아줘",
      guestId: "guest-1",
      location: { lat: 37.5, lng: 127.03 },
      sessionId: 3,
      onDelta,
      onStage,
    });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/chat\/sessions\/3\/events$/);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      "X-Guest-Id": "guest-1",
    });
    expect(onStage).toHaveBeenCalledWith("retrieving");
    expect(onDelta).toHaveBeenLastCalledWith("요금제는 변경할 수 있어요.");
    expect(message).toMatchObject({
      id: "assistant-7",
      role: "assistant",
      content: "요금제는 변경할 수 있어요.",
      storeMap: { type: "PHONE" },
      actions: [{ label: "가까운 매장 보기", href: "/chat?mode=store" }],
    });
  });

  it("shows the failed message on assistant_error", async () => {
    const sse = createSseResponse();
    globalThis.fetch = vi.fn((url: string) => {
      if (url.endsWith("/events")) {
        queueMicrotask(() => sse.send("connected", "ok"));
        return Promise.resolve(sse.response);
      }

      setTimeout(() =>
        sse.send("assistant_error", {
          sessionId: 1,
          messageId: 8,
          code: "INTERNAL_ERROR",
          message: "답변 생성에 실패했습니다.",
        }),
      );
      return Promise.resolve(pendingResponse(8));
    }) as typeof fetch;

    await expect(
      chatApi.sendMessage({ content: "질문", guestId: "g", sessionId: 1 }),
    ).resolves.toMatchObject({ content: FAILED_ANSWER_MESSAGE });
  });

  it("falls back to reloading saved messages when the stream is unavailable", async () => {
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/events")) {
        return Promise.resolve(new Response(null, { status: 404 }));
      }

      if (init?.method === "POST") {
        return Promise.resolve(pendingResponse(9));
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            sessionId: 1,
            messages: [
              {
                messageId: 9,
                role: "ASSISTANT",
                content: "저장된 답변",
                createdAt: "2026-10-06T10:00:01",
                status: "COMPLETED",
              },
            ],
          }),
          { status: 200 },
        ),
      );
    }) as typeof fetch;

    await expect(
      chatApi.sendMessage({ content: "질문", guestId: "g", sessionId: 1 }),
    ).resolves.toMatchObject({ id: "assistant-9", content: "저장된 답변" });
  });

  it("uses final content and ignores events from a different session", async () => {
    const sse = createSseResponse();
    globalThis.fetch = vi.fn((url: string) => {
      if (url.endsWith("/events")) {
        queueMicrotask(() => sse.send("connected", "ok"));
        return Promise.resolve(sse.response);
      }
      sse.send("assistant_delta", {
        sessionId: 2,
        messageId: 7,
        delta: "다른 상담",
      });
      sse.send("assistant_delta", {
        sessionId: 1,
        messageId: 7,
        delta: "초안",
      });
      sse.send("assistant_done", {
        sessionId: 1,
        messageId: 7,
        content: "최종 답변",
        storeMap: null,
        actions: [],
        plans: [],
      });
      return Promise.resolve(pendingResponse(7));
    }) as typeof fetch;
    const onDelta = vi.fn();
    await expect(
      chatApi.sendMessage({
        content: "질문",
        guestId: "g",
        sessionId: 1,
        onDelta,
      }),
    ).resolves.toMatchObject({ content: "최종 답변" });
    expect(onDelta).toHaveBeenCalledExactlyOnceWith("초안");
  });

  it("aborts promptly while waiting for an answer", async () => {
    const sse = createSseResponse();
    const controller = new AbortController();
    globalThis.fetch = vi.fn((url: string) => {
      if (url.endsWith("/events")) {
        queueMicrotask(() => sse.send("connected", "ok"));
        return Promise.resolve(sse.response);
      }
      setTimeout(() => controller.abort(), 0);
      return Promise.resolve(pendingResponse(7));
    }) as typeof fetch;
    await expect(
      chatApi.sendMessage({
        content: "질문",
        guestId: "g",
        sessionId: 1,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("does not send a question after a stream authentication failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ code: "UNAUTHORIZED", message: "인증 필요" }),
          { status: 401 },
        ),
      );
    globalThis.fetch = fetchMock;
    await expect(
      chatApi.sendMessage({ content: "질문", guestId: "g", sessionId: 1 }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reserves time to recover a saved answer if the SSE stays silent", async () => {
    vi.useFakeTimers();
    const sse = createSseResponse();
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/events")) {
        sse.send("connected", "ok");
        return Promise.resolve(sse.response);
      }
      if (init?.method === "POST") return Promise.resolve(pendingResponse(7));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            sessionId: 1,
            messages: [
              {
                messageId: 7,
                status: "COMPLETED",
                content: "복구된 답변",
                createdAt: "2026-10-16T12:00:00",
              },
            ],
          }),
        ),
      );
    }) as typeof fetch;
    const onRecovering = vi.fn();
    try {
      const answer = chatApi.sendMessage({
        content: "질문",
        guestId: "g",
        sessionId: 1,
        onRecovering,
      });
      await vi.advanceTimersByTimeAsync(30001);
      await expect(answer).resolves.toMatchObject({ content: "복구된 답변" });
      expect(onRecovering).toHaveBeenCalledExactlyOnceWith("timeout");
    } finally {
      vi.useRealTimers();
    }
  });

  it("tells the caller when the stream drops mid-answer and recovers the saved answer", async () => {
    const sse = createSseResponse();
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/events")) {
        queueMicrotask(() => sse.send("connected", "ok"));
        return Promise.resolve(sse.response);
      }
      if (init?.method === "POST") {
        setTimeout(() => {
          sse.send("assistant_delta", {
            sessionId: 1,
            messageId: 7,
            delta: "답변 앞부분",
          });
          sse.close();
        }, 0);
        return Promise.resolve(pendingResponse(7));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            sessionId: 1,
            messages: [
              {
                messageId: 7,
                status: "COMPLETED",
                content: "답변 앞부분과 나머지",
                createdAt: "2026-10-20T10:00:00",
              },
            ],
          }),
        ),
      );
    }) as typeof fetch;
    const onRecovering = vi.fn();

    await expect(
      chatApi.sendMessage({
        content: "질문",
        guestId: "g",
        sessionId: 1,
        onRecovering,
      }),
    ).resolves.toMatchObject({ content: "답변 앞부분과 나머지" });
    expect(onRecovering).toHaveBeenCalledExactlyOnceWith("disconnected");
  });

  it("does not report recovery when the stream was never available", async () => {
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/events")) {
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      if (init?.method === "POST") return Promise.resolve(pendingResponse(9));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            sessionId: 1,
            messages: [
              {
                messageId: 9,
                status: "COMPLETED",
                content: "저장된 답변",
                createdAt: "2026-10-20T10:00:00",
              },
            ],
          }),
        ),
      );
    }) as typeof fetch;
    const onRecovering = vi.fn();

    await chatApi.sendMessage({
      content: "질문",
      guestId: "g",
      sessionId: 1,
      onRecovering,
    });
    expect(onRecovering).not.toHaveBeenCalled();
  });
});

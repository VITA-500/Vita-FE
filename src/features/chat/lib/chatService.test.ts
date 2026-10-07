import { afterEach, describe, expect, it, vi } from "vitest";
import { FAILED_ANSWER_MESSAGE } from "./chatAnswerMessage";
import { chatService } from "./chatService";

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

describe("chatService.sendMessage (SSE)", () => {
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
      // POST 응답보다 이벤트가 먼저 와도 놓치지 않아야 한다.
      sse.send("assistant_status", { messageId: 7, status: "retrieving_faq" });
      sse.send("assistant_delta", { messageId: 6, delta: "다른 메시지" });
      sse.send("assistant_delta", { messageId: 7, delta: "요금제는 " });

      setTimeout(() => {
        sse.send("assistant_delta", {
          messageId: 7,
          delta: "변경할 수 있어요.",
        });
        sse.send("assistant_done", {
          messageId: 7,
          content: "요금제는 변경할 수 있어요.",
        });
      }, 0);

      return Promise.resolve(pendingResponse(7));
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const onStage = vi.fn();
    const onDelta = vi.fn();
    const message = await chatService.sendMessage({
      content: "요금제 변경",
      guestId: "guest-1",
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
        sse.send("assistant_error", { messageId: 8, code: "INTERNAL_ERROR" }),
      );
      return Promise.resolve(pendingResponse(8));
    }) as typeof fetch;

    await expect(
      chatService.sendMessage({ content: "질문", guestId: "g", sessionId: 1 }),
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
      chatService.sendMessage({ content: "질문", guestId: "g", sessionId: 1 }),
    ).resolves.toMatchObject({ id: "assistant-9", content: "저장된 답변" });
  });
});

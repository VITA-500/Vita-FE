import {
  toAssistantMessage,
  type ChatMessageResponse,
} from "@/features/chat/lib/chatAnswerMessage";
import {
  createChatApiUrl,
  guestHeaders,
  requestChatJson,
} from "@/features/chat/lib/chatApiClient";
import type {
  ChatApiMessageStatus,
  ChatMessage,
  ChatProgressStage,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { readSseStream, type SseEvent } from "@/shared/api/sse";

export type SendChatMessageOptions = {
  content: string;
  guestId?: string;
  sessionId: number;
  /** 새 대화 시작 등으로 기다리던 답변을 버릴 때 */
  signal?: AbortSignal;
  /** BE가 알려주는 진행 단계(assistant_status) */
  onStage?: (stage: ChatProgressStage) => void;
  /** 지금까지 받은 답변 전체(assistant_delta를 이어 붙인 값) */
  onDelta?: (content: string) => void;
};

/*
 * BE 흐름 (Vita-BE ChatEventController / ChatAnswerStreamer)
 * 1. GET  /chat/sessions/{id}/events  — SSE 구독. 연결되면 `connected` 이벤트가 먼저 온다.
 * 2. POST /chat/sessions/{id}/messages — 답변 자리를 PENDING으로 저장하고 바로 응답한다.
 * 3. 구독 중인 연결로 assistant_status → assistant_delta(반복) → assistant_done | assistant_error.
 *
 * BE는 구독자가 없을 때 이벤트를 버리고(재전송 없음) 최종 답변만 DB에 남긴다.
 * 그래서 구독을 먼저 열고 메시지를 보내며, 연결이 안 되거나 중간에 끊기면 GET /messages로 결과를 다시 조회한다.
 * 게스트는 X-Guest-Id 헤더가 필요해 EventSource(헤더 불가) 대신 fetch 스트림을 직접 읽는다.
 */

/** 구독 후 `connected`를 기다리는 최대 시간. 넘기면 스트리밍 없이 전송하고 재조회로 결과를 받는다. */
const STREAM_CONNECT_TIMEOUT_MS = 5000;
/** 메시지 전송 후 답변 완료까지 기다리는 최대 시간 */
const ANSWER_TIMEOUT_MS = 60000;
const SEND_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 1500;

const STAGE_BY_STATUS: Record<string, ChatProgressStage> = {
  thinking: "understanding",
  retrieving_faq: "retrieving",
  generating: "generating",
};

type ChatStreamPayload = {
  sessionId?: number;
  messageId?: number;
  status?: string;
  delta?: string;
  content?: string;
  code?: string;
  message?: string;
};

type ChatStreamEvent = { name: string; payload: ChatStreamPayload };

type StreamOutcome =
  | { type: "done"; content: string }
  | { type: "error" }
  /** 연결이 끊겼거나 시간이 지나 결과를 모름 → DB 재조회 */
  | { type: "lost" };

const isTerminalStatus = (status: ChatApiMessageStatus) =>
  status === "COMPLETED" || status === "FAILED";

const parseStreamEvent = (event: SseEvent): ChatStreamEvent | null => {
  try {
    const payload = JSON.parse(event.data) as unknown;

    return payload && typeof payload === "object"
      ? { name: event.event, payload: payload as ChatStreamPayload }
      : null;
  } catch {
    return null;
  }
};

const createAbortError = () => new DOMException("Aborted", "AbortError");

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      globalThis.clearTimeout(timeoutId);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });

/** SSE 연결을 열고 이벤트를 넘긴다. `connected`는 연결 확인 여부, `closed`는 연결이 끝나면 resolve된다. */
const openAnswerStream = (
  sessionId: number,
  guestId: string | undefined,
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
) => {
  let resolveConnected: (isConnected: boolean) => void = () => {};
  const connected = new Promise<boolean>((resolve) => {
    resolveConnected = resolve;
  });
  const connectTimeoutId = globalThis.setTimeout(
    () => resolveConnected(false),
    STREAM_CONNECT_TIMEOUT_MS,
  );

  const closed = (async () => {
    const response = await fetch(
      createChatApiUrl(`/chat/sessions/${sessionId}/events`),
      {
        method: "GET",
        cache: "no-store",
        credentials: guestId ? "omit" : "include",
        headers: {
          Accept: "text/event-stream",
          ...guestHeaders(guestId),
        },
        signal,
      },
    );
    const contentType = response.headers.get("Content-Type") ?? "";

    if (
      !response.ok ||
      !response.body ||
      !contentType.includes("text/event-stream")
    ) {
      throw new ApiError(
        `Chat stream failed: ${response.status}`,
        response.status,
      );
    }

    await readSseStream(response.body, (event) => {
      if (event.event === "connected") {
        resolveConnected(true);
        return;
      }

      const parsed = parseStreamEvent(event);

      if (parsed) {
        onEvent(parsed);
      }
    });
  })()
    .catch((error: unknown) => {
      if (!signal.aborted) {
        console.warn("Chat stream disconnected", error);
      }
    })
    .finally(() => {
      globalThis.clearTimeout(connectTimeoutId);
      resolveConnected(false);
    });

  return { closed, connected };
};

/** 스트림으로 결과를 못 받았을 때 DB에 저장된 답변을 다시 조회한다. */
const pollAssistantAnswer = async ({
  deadline,
  guestId,
  messageId,
  sessionId,
  signal,
}: {
  deadline: number;
  guestId?: string;
  messageId: number;
  sessionId: number;
  signal: AbortSignal;
}) => {
  while (Date.now() < deadline) {
    const response = await requestChatJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
      guestId,
      { signal },
    ).catch((error: unknown) => {
      if (signal.aborted) throw error;
      return null;
    });
    const message = response?.messages.find(
      (item) => item.messageId === messageId,
    );

    if (message?.status && isTerminalStatus(message.status)) {
      return message;
    }

    await wait(POLL_INTERVAL_MS, signal);
  }

  throw new Error("Chat answer timed out");
};

export const sendMessageWithStream = async ({
  content,
  guestId,
  onDelta,
  onStage,
  sessionId,
  signal,
}: SendChatMessageOptions): Promise<ChatMessage> => {
  const streamController = new AbortController();
  const abortStream = () => streamController.abort();

  signal?.addEventListener("abort", abortStream, { once: true });

  let targetMessageId: number | undefined;
  let answerTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let streamedContent = "";
  const earlyEvents: ChatStreamEvent[] = [];
  let settle: (outcome: StreamOutcome) => void = () => {};
  const outcome = new Promise<StreamOutcome>((resolve) => {
    settle = resolve;
  });

  const handleEvent = (event: ChatStreamEvent) => {
    // POST 응답보다 이벤트가 먼저 올 수 있다. messageId를 알기 전까지는 모아 둔다.
    if (targetMessageId === undefined) {
      earlyEvents.push(event);
      return;
    }

    if (event.payload.messageId !== targetMessageId) {
      return;
    }

    switch (event.name) {
      case "assistant_status": {
        const stage = STAGE_BY_STATUS[event.payload.status ?? ""];

        if (stage) onStage?.(stage);
        break;
      }
      case "assistant_delta":
        streamedContent += event.payload.delta ?? "";
        onDelta?.(streamedContent);
        break;
      case "assistant_done":
        settle({
          type: "done",
          content: event.payload.content ?? streamedContent,
        });
        break;
      case "assistant_error":
        settle({ type: "error" });
        break;
    }
  };

  const stream = openAnswerStream(
    sessionId,
    guestId,
    streamController.signal,
    handleEvent,
  );

  void stream.closed.then(() => settle({ type: "lost" }));

  try {
    const isStreaming = await stream.connected;

    if (signal?.aborted) throw createAbortError();

    const response = await requestChatJson<ChatMessageResponse>(
      `/chat/sessions/${sessionId}/messages`,
      guestId,
      {
        method: "POST",
        body: JSON.stringify({ content }),
        timeoutMs: SEND_TIMEOUT_MS,
      },
    );

    // 예전처럼 답변을 다 만든 뒤 응답하는 BE면 바로 끝난다.
    if (isTerminalStatus(response.status)) {
      return toAssistantMessage(response);
    }

    const deadline = Date.now() + ANSWER_TIMEOUT_MS;

    targetMessageId = response.messageId;
    earlyEvents.splice(0).forEach(handleEvent);

    const result: StreamOutcome = isStreaming
      ? await Promise.race([
          outcome,
          new Promise<StreamOutcome>((resolve) => {
            answerTimeoutId = globalThis.setTimeout(
              () => resolve({ type: "lost" }),
              ANSWER_TIMEOUT_MS,
            );
          }),
        ])
      : { type: "lost" };

    if (result.type === "done") {
      return toAssistantMessage({
        ...response,
        status: "COMPLETED",
        answer: result.content,
      });
    }

    if (result.type === "error") {
      return toAssistantMessage({ ...response, status: "FAILED" });
    }

    if (signal?.aborted) throw createAbortError();

    const saved = await pollAssistantAnswer({
      deadline,
      guestId,
      messageId: response.messageId,
      sessionId,
      signal: streamController.signal,
    });

    return toAssistantMessage({
      ...response,
      status: saved.status ?? "FAILED",
      answer: saved.content,
      createAt: saved.createdAt,
    });
  } finally {
    globalThis.clearTimeout(answerTimeoutId);
    signal?.removeEventListener("abort", abortStream);
    streamController.abort();
  }
};

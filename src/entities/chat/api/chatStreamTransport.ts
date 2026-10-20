import { parseStreamEvent } from "./chatStreamEvent";
export { parseStreamEvent } from "./chatStreamEvent";
import {
  createChatApiUrl,
  guestHeaders,
  requestChatJson,
} from "./chatApiClient";
import type { ChatStreamEvent } from "./apiTypes";
import type {
  ChatApiMessageStatus,
  ChatProgressStage,
  SessionMessagesResponse,
} from "@/entities/chat/model/types";
import { ApiError } from "@/shared/api/http";
import { readSseStream } from "@/shared/api/sse";
/** 구독 후 `connected`를 기다리는 최대 시간. 넘기면 스트리밍 없이 전송하고 재조회로 결과를 받는다. */
const STREAM_CONNECT_TIMEOUT_MS = 5000;
/** 메시지 전송 후 답변 완료까지 기다리는 최대 시간 */
const POLL_INTERVAL_MS = 1500;

export const STAGE_BY_STATUS: Record<string, ChatProgressStage> = {
  thinking: "understanding",
  retrieving_faq: "retrieving",
  generating: "generating",
};

export const createAbortError = () => new DOMException("Aborted", "AbortError");

/** 정해 둔 시간(ANSWER_TIMEOUT_MS) 안에 답변이 끝나지 않아 기다리기를 멈췄을 때 */
export class ChatAnswerTimeoutError extends Error {
  constructor() {
    super("Chat answer timed out");
    this.name = "ChatAnswerTimeoutError";
  }
}

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
export const openAnswerStream = (
  sessionId: number,
  guestId: string | undefined,
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
) => {
  let streamError: unknown;
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
      const details = !response.ok
        ? await response.json().catch(() => undefined)
        : undefined;
      throw new ApiError(
        details?.message ?? `Chat stream failed: ${response.status}`,
        response.status,
        details,
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
      streamError = error;
      if (!signal.aborted) {
        console.warn("Chat stream disconnected", {
          name: error instanceof Error ? error.name : "UnknownError",
          status: error instanceof ApiError ? error.status : undefined,
        });
      }
    })
    .finally(() => {
      globalThis.clearTimeout(connectTimeoutId);
      resolveConnected(false);
    });

  return { closed, connected, getError: () => streamError };
};

/** 스트림으로 결과를 못 받았을 때 DB에 저장된 답변을 다시 조회한다. */
export const pollAssistantAnswer = async ({
  deadline,
  guestId,
  messageId,
  sessionId,
  signal,
  onRetrying,
}: {
  deadline: number;
  guestId?: string;
  messageId: number;
  sessionId: number;
  signal: AbortSignal;
  onRetrying?: () => void;
}) => {
  let hasReportedRetrying = false;
  while (Date.now() < deadline) {
    const response = await requestChatJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
      guestId,
      { signal, timeoutMs: Math.max(1, deadline - Date.now()) },
    ).catch((error: unknown) => {
      if (
        signal.aborted ||
        (error instanceof ApiError && error.status >= 400 && error.status < 500)
      )
        throw error;
      return null;
    });
    const message = response?.messages.find(
      (item) => item.messageId === messageId,
    );

    if (message?.status === "RETRYING" && !hasReportedRetrying) {
      hasReportedRetrying = true;
      onRetrying?.();
    }

    if (message?.status && isTerminalStatus(message.status)) {
      return message;
    }

    await wait(POLL_INTERVAL_MS, signal);
  }

  throw new ChatAnswerTimeoutError();
};

export const isTerminalStatus = (status: ChatApiMessageStatus) =>
  status === "COMPLETED" || status === "FAILED";

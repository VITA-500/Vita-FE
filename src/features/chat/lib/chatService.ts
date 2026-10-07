import type {
  // ChatAnswerSource, // 참고한 FAQ 표시 숨김 처리로 미사용
  ChatApiMessageStatus,
  ChatMessage,
  ChatProgressStage,
  ChatStoreMap,
  ChatSessionListResponse,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { ApiError, requestJson } from "@/shared/api/http";
import { readSseStream, type SseEvent } from "@/shared/api/sse";
import { env } from "@/shared/config/env";

type ChatSessionCreateResponse = {
  sessionId: number;
  createdAt: string;
};

type ChatMessageResponse = {
  messageId: number;
  status: ChatApiMessageStatus;
  answer: string | null;
  relatedFaqIds: number[];
  createAt: string;
  latencyMs: number;
  storeMap?: ChatStoreMap | null;
  stores?: ChatStoreMap["stores"] | null;
  nearbyStores?: ChatStoreMap["stores"] | null;
};

type SendChatMessageOptions = {
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

const guestHeaders = (guestId?: string) =>
  guestId ? { "X-Guest-Id": guestId } : undefined;

const createChatApiUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${env.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const requestGuestChatJson = async <T>(
  path: string,
  guestId: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(createChatApiUrl(path), {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": guestId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message ?? `Chat API failed: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

type ChatSessionClaimResponse = { sessionId: number; claimedAt: string };

/**
 * 진행 중인 claim 요청. 로그인 직후 채팅 화면의 effect가 여러 번 실행되면
 * (개발 모드 StrictMode의 이중 실행, 로그인 정보 갱신으로 user 객체가 바뀌는 경우)
 * 같은 세션에 claim이 동시에 두 번 나간다. 먼저 도착한 요청이 세션을 회원에게 넘기면
 * 나머지는 BE에서 400("이미 회원 계정에 연결된 세션")으로 실패해 '저장 연동 실패'가 떴다.
 * 같은 세션·게스트 조합은 하나의 요청을 함께 쓰도록 묶는다.
 */
const pendingClaims = new Map<string, Promise<ChatSessionClaimResponse>>();

const requestClaim = async (
  sessionId: number,
  guestId: string,
): Promise<ChatSessionClaimResponse> => {
  try {
    return await requestJson<ChatSessionClaimResponse>(
      `/chat/sessions/${sessionId}/claim`,
      {
        method: "POST",
        headers: guestHeaders(guestId),
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      // 이미 회원 계정에 연결된 세션이다(다른 탭·이전 시도에서 먼저 claim됨).
      // 내 계정 세션이면 메시지 조회가 성공하므로 성공으로 본다. 남의 세션이면 403이 그대로 던져진다.
      await requestJson(`/chat/sessions/${sessionId}/messages`);
      return { sessionId, claimedAt: new Date().toISOString() };
    }

    throw error;
  }
};

/** 다시 시도해도 결과가 같은 claim 실패(세션 없음·남의 세션). 게스트 기록을 정리해도 된다. */
export const isPermanentClaimError = (error: unknown) =>
  error instanceof ApiError && (error.status === 403 || error.status === 404);

export const FAILED_ANSWER_MESSAGE =
  "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";

export const PENDING_ANSWER_MESSAGE =
  "아직 답변을 만들고 있어요. 잠시 후 상담 내역을 다시 열어 주세요.";

const toAssistantMessage = (response: ChatMessageResponse): ChatMessage => {
  // 참고한 FAQ 표시는 사용하지 않기로 해서 숨김 처리 (BE relatedFaqs 미요청).
  // const sources: ChatAnswerSource[] = response.relatedFaqIds.map((faqId) => ({
  //   id: String(faqId),
  //   title: `FAQ #${faqId}`,
  //   category: "FAQ",
  // }));

  // BE는 답변 생성이 실패해도(FAILED) 200으로 answer: null을 준다.
  // 빈 말풍선 대신 다시 물어보라는 안내를 보여준다.
  const answer =
    response.status === "COMPLETED" ? (response.answer?.trim() ?? "") : "";
  const hasAnswer = answer.length > 0;

  return {
    id: `assistant-${response.messageId}`,
    role: "assistant",
    content: hasAnswer ? answer : FAILED_ANSWER_MESSAGE,
    status: hasAnswer ? "success" : "error",
    createdAt: response.createAt,
    storeMap:
      response.storeMap ??
      (response.stores?.length
        ? { stores: response.stores }
        : response.nearbyStores?.length
          ? { stores: response.nearbyStores }
          : undefined),
    // sources: hasAnswer ? sources : [],
  };
};

/* ------------------------------------------------------------------ */
/* SSE 스트리밍                                                        */
/* ------------------------------------------------------------------ */
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

const requestChatJson = <T>(
  path: string,
  guestId: string | undefined,
  options: RequestInit & { timeoutMs?: number } = {},
) => {
  if (guestId) {
    const { timeoutMs, ...requestOptions } = options;

    return requestGuestChatJson<T>(path, guestId, {
      ...requestOptions,
      signal:
        requestOptions.signal ??
        (timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined),
    });
  }

  return requestJson<T>(path, options);
};

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

const sendMessageWithStream = async ({
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

export const chatService = {
  claimGuestSession: (sessionId: number, guestId: string) => {
    const claimKey = `${sessionId}:${guestId}`;
    const pendingClaim = pendingClaims.get(claimKey);

    if (pendingClaim) {
      return pendingClaim;
    }

    const claim = requestClaim(sessionId, guestId).finally(() => {
      pendingClaims.delete(claimKey);
    });

    pendingClaims.set(claimKey, claim);

    return claim;
  },
  createSession: (guestId?: string) => {
    if (guestId) {
      return requestGuestChatJson<ChatSessionCreateResponse>(
        "/chat/sessions",
        guestId,
        {
          method: "POST",
        },
      );
    }

    return requestJson<ChatSessionCreateResponse>("/chat/sessions", {
      method: "POST",
      headers: guestHeaders(guestId),
    });
  },
  getMessages: (sessionId: number, guestId?: string) => {
    return requestChatJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
      guestId,
    );
  },
  getSessions: () => {
    return requestJson<ChatSessionListResponse>("/chat/sessions");
  },
  sendMessage: sendMessageWithStream,
};

import { toAssistantMessage } from "@/entities/chat/model/chatAnswerMessage";
import {
  toChatPlan,
  toChatStoreMap,
} from "@/entities/chat/model/chatResponseAdapters";
import { requestChatJson } from "./chatApiClient";
import {
  openAnswerStream,
  pollAssistantAnswer,
  createAbortError,
  isTerminalStatus,
  STAGE_BY_STATUS,
} from "./chatStreamTransport";
import { ApiError } from "@/shared/api/http";
import type {
  ChatApiAction,
  ChatApiPlan,
  ChatApiStoreMap,
  ChatMessageResponse,
  ChatSendRequest,
  ChatStreamEvent,
} from "./apiTypes";
import type {
  ChatMessage,
  ChatAnswerRecovery,
  ChatProgressStage,
} from "@/entities/chat/model/types";
const ANSWER_TIMEOUT_MS = 60000;
const SEND_TIMEOUT_MS = 15000;
type StreamOutcome =
  | {
      type: "done";
      content: string;
      storeMap?: ChatApiStoreMap | null;
      actions?: readonly ChatApiAction[] | null;
      plans?: readonly ChatApiPlan[] | null;
    }
  | { type: "error"; code: string }
  | { type: "lost" }
  | { type: "timeout" };
export type SendChatMessageOptions = {
  content: string;
  guestId?: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
  sessionId: number;
  /** 새 대화 시작 등으로 기다리던 답변을 버릴 때 */
  signal?: AbortSignal;
  /** BE가 알려주는 진행 단계(assistant_status) */
  onStage?: (stage: ChatProgressStage) => void;
  /** 지금까지 받은 답변 전체(assistant_delta를 이어 붙인 값) */
  onDelta?: (content: string) => void;
  /** 스트림이 끊기거나 늦어져 저장된 답변을 다시 조회하기 시작할 때 */
  onRecovering?: (reason: ChatAnswerRecovery) => void;
};

export const sendMessageWithStream = async ({
  content,
  guestId,
  location,
  onDelta,
  onRecovering,
  onStage,
  sessionId,
  signal,
}: SendChatMessageOptions): Promise<ChatMessage> => {
  if (signal?.aborted) throw createAbortError();
  const streamController = new AbortController();
  const abortStream = () => streamController.abort();

  signal?.addEventListener("abort", abortStream, { once: true });

  let targetMessageId: number | undefined;
  let answerTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let streamedContent = "";
  let receivedTerminalEvent = false;
  const earlyEvents: ChatStreamEvent[] = [];
  let settle: (outcome: StreamOutcome) => void = () => {};
  const outcome = new Promise<StreamOutcome>((resolve) => {
    settle = resolve;
  });

  const onAbort = () => settle({ type: "lost" });
  signal?.addEventListener("abort", onAbort, { once: true });

  const handleEvent = (event: ChatStreamEvent) => {
    if (receivedTerminalEvent || signal?.aborted) return;
    // POST 응답보다 이벤트가 먼저 올 수 있다. messageId를 알기 전까지는 모아 둔다.
    if (targetMessageId === undefined) {
      earlyEvents.push(event);
      return;
    }

    if (
      event.payload.sessionId !== sessionId ||
      event.payload.messageId !== targetMessageId
    ) {
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
        receivedTerminalEvent = true;
        settle({
          type: "done",
          content: event.payload.content ?? streamedContent,
          storeMap: event.payload.storeMap,
          actions: event.payload.actions,
          plans: event.payload.plans,
        });
        break;
      case "assistant_error":
        receivedTerminalEvent = true;
        settle({ type: "error", code: event.payload.code });
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
    const connectionError = stream.getError();
    if (
      connectionError instanceof ApiError &&
      [401, 403].includes(connectionError.status)
    )
      throw connectionError;

    if (signal?.aborted) throw createAbortError();

    const response = await requestChatJson<ChatMessageResponse>(
      `/chat/sessions/${sessionId}/messages`,
      guestId,
      {
        method: "POST",
        body: JSON.stringify({
          content,
          ...(location
            ? {
                lat: location.lat,
                lng: location.lng,
              }
            : {}),
        } satisfies ChatSendRequest),
        timeoutMs: SEND_TIMEOUT_MS,
        signal,
      },
    );

    // 예전처럼 답변을 다 만든 뒤 응답하는 BE면 바로 끝난다.
    if (isTerminalStatus(response.status)) {
      return toAssistantMessage({
        ...response,
        plans: response.plans?.map(toChatPlan),
      });
    }

    const deadline = Date.now() + ANSWER_TIMEOUT_MS;

    if (response.status === "RETRYING") {
      onRecovering?.("retrying");
    }

    targetMessageId = response.messageId;
    earlyEvents.splice(0).forEach(handleEvent);

    const result: StreamOutcome = isStreaming
      ? await Promise.race([
          outcome,
          new Promise<StreamOutcome>((resolve) => {
            answerTimeoutId = globalThis.setTimeout(
              () => resolve({ type: "timeout" }),
              ANSWER_TIMEOUT_MS / 2,
            );
          }),
        ])
      : { type: "lost" };

    if (signal?.aborted) throw createAbortError();

    if (result.type === "done") {
      return toAssistantMessage({
        ...response,
        status: "COMPLETED",
        answer: result.content,
        storeMap: toChatStoreMap(result.storeMap),
        actions: result.actions,
        plans: result.plans?.map(toChatPlan),
      });
    }

    if (result.type === "error") {
      return toAssistantMessage({
        ...response,
        status: "FAILED",
        plans: undefined,
      });
    }

    if (signal?.aborted) throw createAbortError();

    // 처음부터 스트림이 없던 경우는 원래 저장된 답변을 기다리는 흐름이라 알리지 않는다.
    if (isStreaming) {
      onRecovering?.(result.type === "timeout" ? "timeout" : "disconnected");
    }

    const saved = await pollAssistantAnswer({
      deadline,
      guestId,
      messageId: response.messageId,
      sessionId,
      signal: streamController.signal,
      onRetrying: () => onRecovering?.("retrying"),
    });

    return toAssistantMessage({
      ...response,
      status: saved.status ?? "FAILED",
      answer: saved.content,
      createAt: saved.createdAt,
      feedback: saved.feedback,
      storeMap: toChatStoreMap(saved.storeMap),
      actions: saved.actions,
      plans: saved.plans?.map(toChatPlan),
    });
  } finally {
    globalThis.clearTimeout(answerTimeoutId);
    signal?.removeEventListener("abort", abortStream);
    signal?.removeEventListener("abort", onAbort);
    streamController.abort();
  }
};

import type {
  // ChatAnswerSource, // 참고한 FAQ 표시 숨김 처리로 미사용
  ChatMessage,
  ChatStoreMap,
  ChatSessionListResponse,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { ApiError, requestJson } from "@/shared/api/http";
import { env } from "@/shared/config/env";

type ChatSessionCreateResponse = {
  sessionId: number;
  createdAt: string;
};

type ChatMessageResponse = {
  messageId: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";
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
  getMessages: (sessionId: number) => {
    return requestJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
    );
  },
  getSessions: () => {
    return requestJson<ChatSessionListResponse>("/chat/sessions");
  },
  sendMessage: async ({
    content,
    guestId,
    sessionId,
  }: SendChatMessageOptions) => {
    const path = `/chat/sessions/${sessionId}/messages`;
    const response = guestId
      ? await requestGuestChatJson<ChatMessageResponse>(path, guestId, {
          method: "POST",
          body: JSON.stringify({ content }),
          signal: AbortSignal.timeout(45000),
        })
      : await requestJson<ChatMessageResponse>(path, {
          method: "POST",
          body: JSON.stringify({ content }),
          timeoutMs: 45000,
        });

    return toAssistantMessage(response);
  },
};

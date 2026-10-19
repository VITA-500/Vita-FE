import { guestHeaders, requestChatJson } from "./chatApiClient";
import { sendMessageWithStream } from "./chatStream";
import type {
  ChatSessionListResponse,
  SessionMessagesResponse,
} from "@/entities/chat/model/types";
import { ApiError, requestJson } from "@/shared/api/http";

type ChatSessionCreateResponse = {
  sessionId: number;
  createdAt: string;
};

type ChatSessionClaimResponse = { sessionId: number; claimedAt: string };
type ChatSessionPinResponse = { pinned: boolean; sessionId: number };
type ChatSessionTitleResponse = { sessionId: number; title: string };

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

/** 상담 API (/chat/sessions). 세션 생성·목록·메시지·고정·이름 변경·삭제, 게스트 세션 넘기기, 질문 전송(스트림). */
export const chatApi = {
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
  createSession: (guestId?: string, signal?: AbortSignal) => {
    return requestChatJson<ChatSessionCreateResponse>(
      "/chat/sessions",
      guestId,
      {
        method: "POST",
        signal,
        timeoutMs: 8000,
      },
    );
  },
  deleteSession: async (sessionId: number) => {
    await requestJson<void>(`/chat/sessions/${sessionId}`, {
      method: "DELETE",
      timeoutMs: 8000,
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
  updateSessionPin: (sessionId: number, pinned: boolean) => {
    return requestJson<ChatSessionPinResponse>(
      `/chat/sessions/${sessionId}/pin`,
      {
        method: "PATCH",
        body: JSON.stringify({ pinned }),
        timeoutMs: 8000,
      },
    );
  },
  updateSessionTitle: (sessionId: number, title: string) => {
    return requestJson<ChatSessionTitleResponse>(
      `/chat/sessions/${sessionId}/title`,
      {
        method: "PATCH",
        body: JSON.stringify({ title }),
        timeoutMs: 8000,
      },
    );
  },
};

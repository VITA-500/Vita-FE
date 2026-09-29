import type {
  ChatMessageApiResponse,
  ChatSessionClaimResponse,
  ChatSessionCreateResponse,
  ChatSessionListResponse,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { guestChatStorage } from "@/features/chat/lib/guestChatStorage";
import { ApiError, requestJson } from "@/shared/api/http";

const GUEST_HEADER = "X-Guest-Id";
/** Bedrock 응답까지 기다려야 해서 일반 요청보다 길게 잡는다. */
const SEND_MESSAGE_TIMEOUT_MS = 60_000;

/**
 * 채팅 API는 게스트도 쓰므로 항상 X-Guest-Id를 싣는다.
 * BE는 인증 쿠키가 유효하면 이 헤더를 무시하므로 로그인 여부로 분기할 필요가 없다.
 */
const guestHeaders = () => ({
  [GUEST_HEADER]: guestChatStorage.getOrCreateGuestId(),
});

export const chatService = {
  createSession: () => {
    return requestJson<ChatSessionCreateResponse>("/chat/sessions", {
      headers: guestHeaders(),
      method: "POST",
    });
  },

  getSessions: () => {
    return requestJson<ChatSessionListResponse>("/chat/sessions", {
      headers: guestHeaders(),
    });
  },

  getMessages: (sessionId: number) => {
    return requestJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
      {
        headers: guestHeaders(),
      },
    );
  },

  sendMessage: (sessionId: number, content: string) => {
    return requestJson<ChatMessageApiResponse>(
      `/chat/sessions/${sessionId}/messages`,
      {
        body: JSON.stringify({ content }),
        headers: guestHeaders(),
        method: "POST",
        timeoutMs: SEND_MESSAGE_TIMEOUT_MS,
      },
    );
  },

  /** 로그인한 상태에서 호출한다. 게스트 세션을 현재 회원 계정에 귀속시킨다. */
  claimSession: (sessionId: number, guestId: string) => {
    return requestJson<ChatSessionClaimResponse>(
      `/chat/sessions/${sessionId}/claim`,
      {
        headers: { [GUEST_HEADER]: guestId },
        method: "POST",
      },
    );
  },
};

export type GuestChatClaimResult = {
  claimedSessionIds: number[];
};

/** 다시 시도해도 결과가 같은 실패 — 목록에서 빼야 무한 재시도를 막는다. */
const isPermanentClaimFailure = (error: unknown) =>
  error instanceof ApiError && [400, 403, 404].includes(error.status);

let claimPromise: Promise<GuestChatClaimResult> | null = null;

const runClaim = async (): Promise<GuestChatClaimResult> => {
  const guestId = guestChatStorage.peekGuestId();
  const pendingIds = guestChatStorage.getPendingGuestSessionIds();
  const claimedSessionIds: number[] = [];

  if (!guestId || pendingIds.length === 0) {
    return { claimedSessionIds };
  }

  for (const sessionId of pendingIds) {
    try {
      await chatService.claimSession(sessionId, guestId);
      claimedSessionIds.push(sessionId);
      guestChatStorage.removePendingGuestSession(sessionId);
    } catch (error) {
      // 400: 이미 회원 계정에 연결됨(다른 탭에서 먼저 claim 등) → 회원 세션으로 취급한다.
      //      실제로 내 세션이 아니면 이후 메시지 조회에서 403이 나고 화면에서 정리된다.
      if (error instanceof ApiError && error.status === 400) {
        claimedSessionIds.push(sessionId);
      }

      if (isPermanentClaimFailure(error)) {
        guestChatStorage.removePendingGuestSession(sessionId);
        continue;
      }

      // 401(아직 로그인 안 됨)·네트워크 오류 등은 다음 기회에 다시 시도한다.
      break;
    }
  }

  const active = guestChatStorage.getActiveSession();

  if (active?.owner === "guest") {
    if (claimedSessionIds.includes(active.sessionId)) {
      guestChatStorage.setActiveSession({ ...active, owner: "member" });
    } else if (
      !guestChatStorage.getPendingGuestSessionIds().includes(active.sessionId)
    ) {
      // 귀속에 실패해 더 이상 접근할 수 없는 게스트 세션이다.
      guestChatStorage.clearActiveSession();
    }
  }

  return { claimedSessionIds };
};

/**
 * 게스트로 나눈 대화를 로그인한 회원 계정으로 옮긴다.
 * StrictMode의 이중 effect나 여러 컴포넌트에서 동시에 불려도 한 번만 실행된다.
 */
export const claimGuestChatSessions = () => {
  claimPromise ??= runClaim().finally(() => {
    claimPromise = null;
  });

  return claimPromise;
};

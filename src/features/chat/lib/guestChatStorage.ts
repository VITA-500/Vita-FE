/**
 * 비회원(게스트) 채팅 식별자와 세션 귀속 정보를 브라우저에 보관한다.
 *
 * - guestId: BE가 X-Guest-Id 헤더로 게스트를 식별한다(UUID 형식 필수).
 *   최초 채팅 시 한 번 만들고 계속 재사용한다.
 * - pendingGuestSessionIds: 게스트로 만든 채팅 세션 목록. 로그인하면
 *   POST /chat/sessions/{id}/claim 으로 회원 계정에 귀속시키고 목록에서 뺀다.
 * - activeSession: 지금 보고 있는 세션. 로그인 페이지를 다녀와도 같은 대화로
 *   돌아오게 하려고 저장한다. owner로 게스트/회원 소유를 구분해, 로그아웃 뒤
 *   회원 대화가 게스트 화면에 복원되지 않게 한다.
 */

const GUEST_ID_KEY = "vita-guest-id";
const PENDING_SESSIONS_KEY = "vita-guest-chat-sessions";
const ACTIVE_SESSION_KEY = "vita-active-chat-session";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatSessionOwner = "guest" | "member";

export type ActiveChatSession = {
  sessionId: number;
  owner: ChatSessionOwner;
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readJson = <T>(key: string): T | null => {
  const storage = getStorage();
  const raw = storage?.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    storage?.removeItem(key);
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 막힌 환경(시크릿 모드 등)에서는 조용히 무시한다.
  }
};

/** crypto.randomUUID는 보안 컨텍스트(https/localhost)에서만 있어 대체 구현을 둔다. */
const createUuid = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
};

const isSessionId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const guestChatStorage = {
  /** 저장된 guestId를 돌려준다. 없으면 null (새로 만들지 않는다). */
  peekGuestId: () => {
    const guestId = getStorage()?.getItem(GUEST_ID_KEY) ?? null;

    return guestId && UUID_PATTERN.test(guestId) ? guestId : null;
  },

  /** 저장된 guestId를 돌려주고, 없거나 형식이 틀리면 새로 만들어 저장한다. */
  getOrCreateGuestId: () => {
    const existing = guestChatStorage.peekGuestId();

    if (existing) {
      return existing;
    }

    const guestId = createUuid();

    try {
      getStorage()?.setItem(GUEST_ID_KEY, guestId);
    } catch {
      // 저장이 안 되면 이번 페이지 동안만 쓰인다.
    }

    return guestId;
  },

  getPendingGuestSessionIds: (): number[] => {
    const ids = readJson<unknown[]>(PENDING_SESSIONS_KEY);

    return Array.isArray(ids) ? ids.filter(isSessionId) : [];
  },

  addPendingGuestSession: (sessionId: number) => {
    const ids = guestChatStorage.getPendingGuestSessionIds();

    if (!ids.includes(sessionId)) {
      writeJson(PENDING_SESSIONS_KEY, [...ids, sessionId]);
    }
  },

  removePendingGuestSession: (sessionId: number) => {
    const ids = guestChatStorage
      .getPendingGuestSessionIds()
      .filter((id) => id !== sessionId);

    if (ids.length === 0) {
      getStorage()?.removeItem(PENDING_SESSIONS_KEY);
      return;
    }

    writeJson(PENDING_SESSIONS_KEY, ids);
  },

  getActiveSession: (): ActiveChatSession | null => {
    const session = readJson<Partial<ActiveChatSession>>(ACTIVE_SESSION_KEY);

    if (
      !session ||
      !isSessionId(session.sessionId) ||
      (session.owner !== "guest" && session.owner !== "member")
    ) {
      return null;
    }

    return { sessionId: session.sessionId, owner: session.owner };
  },

  setActiveSession: (session: ActiveChatSession) => {
    writeJson(ACTIVE_SESSION_KEY, session);
  },

  clearActiveSession: () => {
    getStorage()?.removeItem(ACTIVE_SESSION_KEY);
  },
};

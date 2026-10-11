/**
 * 상담 고정·삭제 상태를 브라우저(localStorage)에 계정별로 기억한다.
 *
 * BE에 상담 고정/삭제 API가 아직 없어서 FE에서만 처리한다.
 * - 고정: 이 브라우저에서만 유지된다.
 * - 삭제: 서버 기록은 그대로 두고 이 브라우저의 목록에서만 숨긴다.
 * BE API가 생기면 이 모듈의 읽기/쓰기만 API 호출로 바꾸면 된다.
 */

export type ChatSessionPreferences = {
  /** 고정한 순서대로 쌓인다(먼저 고정한 상담이 위). */
  pinnedSessionIds: readonly number[];
  deletedSessionIds: readonly number[];
};

const STORAGE_KEY_PREFIX = "vita-chat-session-preferences";

export const EMPTY_CHAT_SESSION_PREFERENCES: ChatSessionPreferences = {
  pinnedSessionIds: [],
  deletedSessionIds: [],
};

const getStorageKey = (userId: number) =>
  `${STORAGE_KEY_PREFIX}:user:${userId}`;

const toSessionIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (item): item is number =>
              typeof item === "number" && Number.isInteger(item),
          ),
        ),
      )
    : [];

const parsePreferences = (rawValue: string | null): ChatSessionPreferences => {
  if (!rawValue) return EMPTY_CHAT_SESSION_PREFERENCES;

  try {
    const parsed = JSON.parse(rawValue) as Partial<
      Record<keyof ChatSessionPreferences, unknown>
    > | null;

    return {
      pinnedSessionIds: toSessionIds(parsed?.pinnedSessionIds),
      deletedSessionIds: toSessionIds(parsed?.deletedSessionIds),
    };
  } catch {
    return EMPTY_CHAT_SESSION_PREFERENCES;
  }
};

const readRaw = (userId: number) => {
  try {
    return window.localStorage.getItem(getStorageKey(userId));
  } catch {
    return null;
  }
};

const listeners = new Set<() => void>();
/** useSyncExternalStore가 같은 값이면 같은 객체를 받도록 마지막으로 읽은 값을 둔다. */
const snapshotCache = new Map<
  number,
  { rawValue: string | null; value: ChatSessionPreferences }
>();

const notify = () => listeners.forEach((listener) => listener());

export const chatSessionPreferencesStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);

    // 다른 탭에서 바꾼 고정·삭제도 따라간다.
    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(STORAGE_KEY_PREFIX)) listener();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  },
  get: (userId: number): ChatSessionPreferences => {
    const rawValue = readRaw(userId);
    const cached = snapshotCache.get(userId);

    if (cached && cached.rawValue === rawValue) return cached.value;

    const value = parsePreferences(rawValue);
    snapshotCache.set(userId, { rawValue, value });

    return value;
  },
  update: (
    userId: number,
    updater: (current: ChatSessionPreferences) => ChatSessionPreferences,
  ) => {
    const next = updater(chatSessionPreferencesStore.get(userId));

    try {
      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
    } catch {
      // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 이번 화면에서만 반영한다.
      snapshotCache.set(userId, { rawValue: readRaw(userId), value: next });
    }

    notify();
  },
};

export const togglePinnedSession = (
  preferences: ChatSessionPreferences,
  sessionId: number,
): ChatSessionPreferences => ({
  ...preferences,
  pinnedSessionIds: preferences.pinnedSessionIds.includes(sessionId)
    ? preferences.pinnedSessionIds.filter((id) => id !== sessionId)
    : [...preferences.pinnedSessionIds, sessionId],
});

export const markSessionDeleted = (
  preferences: ChatSessionPreferences,
  sessionId: number,
): ChatSessionPreferences => ({
  pinnedSessionIds: preferences.pinnedSessionIds.filter(
    (id) => id !== sessionId,
  ),
  deletedSessionIds: preferences.deletedSessionIds.includes(sessionId)
    ? preferences.deletedSessionIds
    : [...preferences.deletedSessionIds, sessionId],
});

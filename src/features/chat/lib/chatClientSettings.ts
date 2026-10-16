/**
 * 채팅 사용 설정(빠른 액션 구성). 서버에 보내지 않고 이 브라우저에만 저장한다.
 */
export const chatQuickActionIds = [
  "change_plan",
  "nearby_store",
  "partner_benefit",
  "consult_summary",
] as const;

export type ChatQuickActionId = (typeof chatQuickActionIds)[number];

export type ChatClientSettings = {
  /** 빠른 액션 메뉴에 보여줄 항목(보여줄 순서대로). */
  quickActionIds: ChatQuickActionId[];
};

export const CHAT_CLIENT_SETTINGS_STORAGE_KEY = "vita-chat-client-settings";

export const defaultChatClientSettings: ChatClientSettings = {
  quickActionIds: [...chatQuickActionIds],
};

const isQuickActionId = (value: unknown): value is ChatQuickActionId =>
  chatQuickActionIds.includes(value as ChatQuickActionId);

const normalizeQuickActionIds = (value: unknown): ChatQuickActionId[] => {
  if (!Array.isArray(value)) return [...chatQuickActionIds];

  return Array.from(new Set(value.filter(isQuickActionId)));
};

export const normalizeChatClientSettings = (
  settings: Partial<ChatClientSettings> | null | undefined,
): ChatClientSettings => ({
  quickActionIds: normalizeQuickActionIds(settings?.quickActionIds),
});

/** 빠른 액션 하나의 표시 여부를 바꾼다. 다시 켜면 원래 순서 자리로 돌아간다. */
export const toggleQuickAction = (
  ids: readonly ChatQuickActionId[],
  id: ChatQuickActionId,
): ChatQuickActionId[] =>
  ids.includes(id)
    ? ids.filter((item) => item !== id)
    : chatQuickActionIds.filter((item) => item === id || ids.includes(item));

/** 보이는 빠른 액션의 순서를 한 칸 옮긴다. 끝에서 더 옮기면 그대로 둔다. */
export const moveQuickAction = (
  ids: readonly ChatQuickActionId[],
  id: ChatQuickActionId,
  direction: -1 | 1,
): ChatQuickActionId[] => {
  const index = ids.indexOf(id);
  const target = index + direction;

  if (index < 0 || target < 0 || target >= ids.length) return [...ids];

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];

  return next;
};

export const loadChatClientSettings = (): ChatClientSettings => {
  if (typeof window === "undefined") return defaultChatClientSettings;

  try {
    const saved = window.localStorage.getItem(CHAT_CLIENT_SETTINGS_STORAGE_KEY);

    return normalizeChatClientSettings(saved ? JSON.parse(saved) : null);
  } catch {
    return defaultChatClientSettings;
  }
};

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: ChatClientSettings | null = null;

const getSnapshot = () => {
  snapshot ??= loadChatClientSettings();
  return snapshot;
};

export const chatClientSettingsStore = {
  getServerSnapshot: () => defaultChatClientSettings,
  getSnapshot,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update: (patch: Partial<ChatClientSettings>) => {
    snapshot = normalizeChatClientSettings({ ...getSnapshot(), ...patch });

    try {
      window.localStorage.setItem(
        CHAT_CLIENT_SETTINGS_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch {
      // 저장에 실패해도 지금 화면에는 적용한다.
    }

    listeners.forEach((listener) => listener());
  },
};

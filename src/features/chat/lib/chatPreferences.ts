export type HistoryPreference = "ask_before_use" | "auto_apply";

export type ChatPreferences = {
  usePreviousConsultation: boolean;
  historyPreference: HistoryPreference;
};

export const CHAT_PREFERENCES_STORAGE_KEY = "vita-chat-preferences";

export const historyPreferenceOptions: {
  description: string;
  label: string;
  value: HistoryPreference;
}[] = [
  {
    value: "ask_before_use",
    label: "활용 여부 먼저 확인",
    description: "이전 상담 기록을 쓰기 전에 먼저 물어봅니다.",
  },
  {
    value: "auto_apply",
    label: "자동 적용",
    description: "이전 상담 기록을 새 상담에 바로 참고합니다.",
  },
] as const;

export const defaultChatPreferences: ChatPreferences = {
  usePreviousConsultation: false,
  historyPreference: "ask_before_use",
};

const isHistoryPreference = (value: unknown): value is HistoryPreference =>
  historyPreferenceOptions.some((option) => option.value === value);

export const normalizeChatPreferences = (
  preferences: Partial<ChatPreferences> | null | undefined,
): ChatPreferences => ({
  usePreviousConsultation:
    typeof preferences?.usePreviousConsultation === "boolean"
      ? preferences.usePreviousConsultation
      : defaultChatPreferences.usePreviousConsultation,
  historyPreference: isHistoryPreference(preferences?.historyPreference)
    ? preferences.historyPreference
    : defaultChatPreferences.historyPreference,
});

export const loadChatPreferences = (): ChatPreferences => {
  if (typeof window === "undefined") return defaultChatPreferences;

  try {
    const saved = window.localStorage.getItem(CHAT_PREFERENCES_STORAGE_KEY);

    return normalizeChatPreferences(saved ? JSON.parse(saved) : null);
  } catch {
    return defaultChatPreferences;
  }
};

export const saveChatPreferences = (preferences: ChatPreferences) => {
  window.localStorage.setItem(
    CHAT_PREFERENCES_STORAGE_KEY,
    JSON.stringify(normalizeChatPreferences(preferences)),
  );
};

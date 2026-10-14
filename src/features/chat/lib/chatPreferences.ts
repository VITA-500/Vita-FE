export type ChatAnswerTone = "brief" | "normal" | "detailed";

export type ChatPreferences = {
  answerTone: ChatAnswerTone;
  interestedTopics: string[];
  useLocationContext: boolean;
};

export const CHAT_PREFERENCES_STORAGE_KEY = "vita-chat-preferences";

export const chatPreferenceTopics = [
  "요금제",
  "제휴 혜택",
  "매장",
  "로밍",
  "분실/보호",
  "결합 할인",
] as const;

export const defaultChatPreferences: ChatPreferences = {
  answerTone: "normal",
  interestedTopics: ["요금제", "제휴 혜택"],
  useLocationContext: true,
};

const isChatAnswerTone = (value: unknown): value is ChatAnswerTone =>
  value === "brief" || value === "normal" || value === "detailed";

const isKnownTopic = (topic: string) =>
  chatPreferenceTopics.includes(topic as (typeof chatPreferenceTopics)[number]);

export const normalizeChatPreferences = (
  preferences: Partial<ChatPreferences> | null | undefined,
): ChatPreferences => ({
  answerTone: isChatAnswerTone(preferences?.answerTone)
    ? preferences.answerTone
    : defaultChatPreferences.answerTone,
  interestedTopics: Array.isArray(preferences?.interestedTopics)
    ? preferences.interestedTopics.filter(isKnownTopic)
    : defaultChatPreferences.interestedTopics,
  useLocationContext:
    typeof preferences?.useLocationContext === "boolean"
      ? preferences.useLocationContext
      : defaultChatPreferences.useLocationContext,
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

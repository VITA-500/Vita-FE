import { useCallback, useSyncExternalStore } from "react";
import {
  chatSessionPreferencesStore,
  EMPTY_CHAT_SESSION_PREFERENCES,
  markSessionDeleted,
  togglePinnedSession,
} from "@/features/chat/lib/chatSessionPreferences";

/** 로그인한 사용자의 상담 고정·삭제 상태. 비회원은 상담 목록이 없어 빈 값이다. */
export const useChatSessionPreferences = (userId?: number) => {
  const preferences = useSyncExternalStore(
    chatSessionPreferencesStore.subscribe,
    () =>
      userId === undefined
        ? EMPTY_CHAT_SESSION_PREFERENCES
        : chatSessionPreferencesStore.get(userId),
    () => EMPTY_CHAT_SESSION_PREFERENCES,
  );

  const togglePin = useCallback(
    (sessionId: number) => {
      if (userId === undefined) return;
      chatSessionPreferencesStore.update(userId, (current) =>
        togglePinnedSession(current, sessionId),
      );
    },
    [userId],
  );

  const markDeleted = useCallback(
    (sessionId: number) => {
      if (userId === undefined) return;
      chatSessionPreferencesStore.update(userId, (current) =>
        markSessionDeleted(current, sessionId),
      );
    },
    [userId],
  );

  return {
    deletedSessionIds: preferences.deletedSessionIds,
    markDeleted,
    pinnedSessionIds: preferences.pinnedSessionIds,
    togglePin,
  };
};

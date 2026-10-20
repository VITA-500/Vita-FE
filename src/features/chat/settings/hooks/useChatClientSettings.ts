"use client";

import { useSyncExternalStore } from "react";
import { chatClientSettingsStore } from "@/features/chat/settings/lib/chatClientSettings";

/** 설정 패널에서 바꾸면 입력창·빠른 액션 메뉴에 바로 반영된다. */
export const useChatClientSettings = () => {
  const settings = useSyncExternalStore(
    chatClientSettingsStore.subscribe,
    chatClientSettingsStore.getSnapshot,
    chatClientSettingsStore.getServerSnapshot,
  );

  return { settings, updateSettings: chatClientSettingsStore.update };
};

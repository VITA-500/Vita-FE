"use client";

import { useState } from "react";
import {
  loadChatPreferences,
  saveChatPreferences,
  type ChatPreferences,
} from "@/features/chat/lib/chatPreferences";

export const useChatPreferences = () => {
  const [preferences, setPreferences] =
    useState<ChatPreferences>(loadChatPreferences);

  const updatePreferences = (nextPreferences: ChatPreferences) => {
    setPreferences(nextPreferences);
    saveChatPreferences(nextPreferences);
  };

  return { preferences, updatePreferences };
};

import type { MouseEvent } from "react";
import { useCallback, useState } from "react";

type FloatingChatMenu = {
  chatKey: string;
  left: number;
  top: number;
};

const CHAT_MENU_HEIGHT = 348;
const CHAT_MENU_WIDTH = 260;
const CHAT_MENU_GAP = 8;
const VIEWPORT_PADDING = 12;
const SIDEBAR_MENU_LEFT = 244;

const getChatMenuPosition = (trigger: HTMLElement) => {
  const rect = trigger.getBoundingClientRect();
  const canOpenDown =
    rect.bottom + CHAT_MENU_GAP + CHAT_MENU_HEIGHT <=
    window.innerHeight - VIEWPORT_PADDING;
  const top = canOpenDown
    ? rect.bottom + CHAT_MENU_GAP
    : Math.max(VIEWPORT_PADDING, rect.top - CHAT_MENU_HEIGHT - CHAT_MENU_GAP);
  const left = Math.min(
    window.innerWidth - CHAT_MENU_WIDTH - VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, SIDEBAR_MENU_LEFT),
  );

  return { left, top };
};

export const useFloatingChatMenu = () => {
  const [chatMenu, setChatMenu] = useState<FloatingChatMenu | null>(null);

  const closeChatMenu = useCallback(() => {
    setChatMenu(null);
  }, []);

  const openChatMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>, chatKey: string) => {
      event.stopPropagation();

      setChatMenu((currentMenu) =>
        currentMenu?.chatKey === chatKey
          ? null
          : {
              chatKey,
              ...getChatMenuPosition(event.currentTarget),
            },
      );
    },
    [],
  );

  return { chatMenu, closeChatMenu, openChatMenu };
};

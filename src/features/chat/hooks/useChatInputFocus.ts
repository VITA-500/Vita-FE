import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { ChatMode } from "@/features/chat/types";

export const useChatInputFocus = ({
  activeMode,
  chatInputRef,
  chatStatus,
}: {
  activeMode: ChatMode;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  chatStatus: "idle" | "loading";
}) => {
  const focusChatInput = useCallback(() => {
    const input = chatInputRef.current;
    if (!input || input.disabled) return;
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement !== input &&
      (activeElement.closest("[role='dialog']") ||
        activeElement.matches(
          "input, textarea, select, [contenteditable='true']",
        ))
    )
      return;
    input.focus({ preventScroll: true });
  }, [chatInputRef]);
  const previousChatStatusRef = useRef(chatStatus);

  useEffect(() => {
    const wasLoading = previousChatStatusRef.current === "loading";
    previousChatStatusRef.current = chatStatus;
    if (!wasLoading || chatStatus !== "idle" || activeMode !== "chat") return;
    let frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(focusChatInput);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeMode, chatStatus, focusChatInput]);

  return { focusChatInput };
};

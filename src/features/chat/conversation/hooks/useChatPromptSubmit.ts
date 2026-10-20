"use client";

import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { chatService } from "@/features/chat/lib/chatService";
import { createGuestId } from "@/features/chat/conversation/lib/chatConversationStorage";
import {
  isStoreRelatedPrompt,
  toChatTitle,
} from "@/features/chat/conversation/lib/chatMessages";
import { getCurrentChatLocation } from "@/features/chat/store/lib/chatStoreMap";
import { getChatError } from "@/features/chat/conversation/lib/chatErrors";
import { createTextReveal } from "@/features/chat/conversation/lib/chatTextReveal";
import type {
  ChatMessage,
  ChatStreamingReply,
  ChatConversationStatus,
} from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/providers/ToastProvider";

type SubmitChatPromptOptions = {
  /** 이 메시지부터 뒤를 지우고 새 질문으로 다시 묻는다(질문 수정 · 다시 시도). */
  replaceFromMessageId?: string;
};

type UseChatPromptSubmitParams = {
  answerAbortRef: RefObject<AbortController | null>;
  chatInput: string;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  chatStatus: "idle" | "loading";
  setConversationStatus: (status: ChatConversationStatus) => void;
  clearEditHint: () => void;
  currentChatTitle: string;
  currentGuestId?: string;
  currentSessionId?: number;
  focusChatInput: () => void;
  hasUser: boolean;
  isAuthenticated: boolean;
  refreshChatSessions: () => Promise<void>;
  setChatInput: Dispatch<SetStateAction<string>>;
  setChatStatus: Dispatch<SetStateAction<"idle" | "loading">>;
  setCurrentChatTitle: Dispatch<SetStateAction<string>>;
  setCurrentGuestId: Dispatch<SetStateAction<string | undefined>>;
  setCurrentSessionId: Dispatch<SetStateAction<number | undefined>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setSessionTitles: Dispatch<SetStateAction<Record<number, string>>>;
  setStreamingReply: Dispatch<SetStateAction<ChatStreamingReply | null>>;
};

export const useChatPromptSubmit = ({
  answerAbortRef,
  chatInput,
  chatInputRef,
  chatStatus,
  clearEditHint,
  currentChatTitle,
  currentGuestId,
  currentSessionId,
  focusChatInput,
  hasUser,
  isAuthenticated,
  refreshChatSessions,
  setChatInput,
  setChatStatus,
  setConversationStatus,
  setCurrentChatTitle,
  setCurrentGuestId,
  setCurrentSessionId,
  setMessages,
  setSessionTitles,
  setStreamingReply,
}: UseChatPromptSubmitParams) =>
  useCallback(
    async (
      prompt: string = chatInput,
      { replaceFromMessageId }: SubmitChatPromptOptions = {},
    ) => {
      const trimmedPrompt = prompt.trim();

      if (!trimmedPrompt || chatStatus === "loading" || answerAbortRef.current)
        return;
      if (trimmedPrompt.length > 2000) {
        showToast("질문은 2000자 이내로 입력해 주세요.");
        return;
      }

      clearEditHint();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedPrompt,
        createdAt: new Date().toISOString(),
      };

      if (!currentChatTitle) setCurrentChatTitle(toChatTitle(trimmedPrompt));

      const answerController = new AbortController();
      const { signal } = answerController;

      answerAbortRef.current = answerController;

      setMessages((currentMessages) => {
        const replaceIndex = replaceFromMessageId
          ? currentMessages.findIndex(({ id }) => id === replaceFromMessageId)
          : -1;
        const baseMessages =
          replaceIndex >= 0
            ? currentMessages.slice(0, replaceIndex)
            : currentMessages;

        return [...baseMessages, userMessage];
      });
      if (!replaceFromMessageId) setChatInput("");
      setChatStatus("loading");
      setConversationStatus("loading");
      setStreamingReply({ content: "" });

      const textReveal = createTextReveal(({ content, isPreparingBlock }) => {
        if (signal.aborted) return;
        setStreamingReply((reply) => ({ ...reply, content, isPreparingBlock }));
      });

      signal.addEventListener("abort", () => textReveal.cancel(), {
        once: true,
      });
      window.requestAnimationFrame(() => chatInputRef.current?.focus());

      try {
        const nextGuestId =
          isAuthenticated || hasUser
            ? undefined
            : (currentGuestId ?? createGuestId());
        const nextSessionId =
          currentSessionId ??
          (await chatService.createSession(nextGuestId, signal)).sessionId;

        if (signal.aborted) return;

        setCurrentGuestId(nextGuestId);
        setCurrentSessionId(nextSessionId);
        setSessionTitles((titles) =>
          titles[nextSessionId]
            ? titles
            : { ...titles, [nextSessionId]: toChatTitle(trimmedPrompt) },
        );

        if (signal.aborted) return;

        const isStorePrompt = isStoreRelatedPrompt(trimmedPrompt);
        const location = isStorePrompt ? await getCurrentChatLocation() : null;

        if (signal.aborted) return;

        const assistantMessage = await chatService.sendMessage({
          content: trimmedPrompt,
          guestId: nextGuestId,
          location,
          sessionId: nextSessionId,
          signal,
          onStage: (stage) => {
            if (signal.aborted) return;
            setConversationStatus(
              stage === "understanding"
                ? "thinking"
                : stage === "retrieving"
                  ? "retrieving_faq"
                  : "generating",
            );
            setStreamingReply((reply) => ({ content: "", ...reply, stage }));
          },
          onDelta: (content) => {
            if (signal.aborted) return;
            setConversationStatus("generating");
            textReveal.push(content);
          },
          onRecovering: (recovery) => {
            if (signal.aborted) return;
            setStreamingReply((reply) => ({ content: "", ...reply, recovery }));
          },
        });
        if (signal.aborted) return;
        const nextAssistantMessage = assistantMessage;

        await textReveal.finish(nextAssistantMessage.content);

        if (signal.aborted) return;
        focusChatInput();
        setConversationStatus(
          assistantMessage.status === "error" ? "failed" : "done",
        );

        setMessages((currentMessages) => [
          ...currentMessages,
          nextAssistantMessage,
        ]);

        if (isAuthenticated) void refreshChatSessions();
      } catch (error) {
        textReveal.cancel();

        if (signal.aborted) return;

        console.error("Chat API request failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          status: error instanceof ApiError ? error.status : undefined,
        });
        const failure = getChatError(error);
        setConversationStatus(failure.status);
        if (failure.resetSession) setCurrentSessionId(undefined);
        if (failure.status === "expired" && isAuthenticated) {
          window.dispatchEvent(new Event("vita-auth-changed"));
        }
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: failure.message,
            status: "error",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        if (answerAbortRef.current === answerController) {
          answerAbortRef.current = null;
          setStreamingReply(null);
          setChatStatus("idle");
        }
      }
    },
    [
      answerAbortRef,
      chatInput,
      chatInputRef,
      chatStatus,
      clearEditHint,
      currentChatTitle,
      currentGuestId,
      currentSessionId,
      focusChatInput,
      hasUser,
      isAuthenticated,
      refreshChatSessions,
      setChatInput,
      setChatStatus,
      setConversationStatus,
      setCurrentChatTitle,
      setCurrentGuestId,
      setCurrentSessionId,
      setMessages,
      setSessionTitles,
      setStreamingReply,
    ],
  );

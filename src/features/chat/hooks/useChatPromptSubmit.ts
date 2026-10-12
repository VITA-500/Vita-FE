"use client";

import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { chatService } from "@/features/chat/lib/chatService";
import { createGuestId } from "@/features/chat/lib/chatConversationStorage";
import {
  createFallbackAssistantMessage,
  isStoreRelatedPrompt,
  toChatTitle,
} from "@/features/chat/lib/chatMessages";
import {
  findPartnerChatStoreMap,
  findChatStoreMap,
  getCurrentChatLocation,
  shouldUsePartnerStoreFallback,
  shouldUseLocalStoreFallback,
} from "@/features/chat/lib/chatStoreMap";
import { chatStoreMapCache } from "@/features/chat/lib/chatStoreMapCache";
import {
  normalizeStoreMapMessageForPrompt,
  shouldCacheStoreMapForPrompt,
} from "@/features/chat/lib/chatStoreMapMessage";
import { createTextReveal } from "@/features/chat/lib/chatTextReveal";
import type { ChatMessage, ChatStreamingReply } from "@/features/chat/types";

type SubmitChatPromptOptions = {
  /** 이 메시지부터 뒤를 지우고 새 질문으로 다시 묻는다(질문 수정 · 다시 시도). */
  replaceFromMessageId?: string;
};

type UseChatPromptSubmitParams = {
  answerAbortRef: RefObject<AbortController | null>;
  chatInput: string;
  chatInputRef: RefObject<HTMLInputElement | null>;
  chatStatus: "idle" | "loading";
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

      if (!trimmedPrompt || chatStatus === "loading") return;

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

      answerAbortRef.current?.abort();
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
          (await chatService.createSession(nextGuestId)).sessionId;

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
            setStreamingReply((reply) => ({ content: "", ...reply, stage }));
          },
          onDelta: (content) => {
            if (signal.aborted) return;
            if (isStorePrompt) {
              return;
            }
            textReveal.push(content);
          },
        });
        const shouldFindPartnerStores =
          location &&
          shouldUsePartnerStoreFallback(
            trimmedPrompt,
            assistantMessage.storeMap,
          );
        const shouldFindPhoneStores =
          location &&
          shouldUseLocalStoreFallback(trimmedPrompt) &&
          !assistantMessage.storeMap;
        const storeMapPromise = shouldFindPartnerStores
          ? findPartnerChatStoreMap({
              origin: location,
              originSource: "current",
              prompt: trimmedPrompt,
            }).catch(() => undefined)
          : shouldFindPhoneStores
            ? findChatStoreMap({
                origin: location,
                originSource: "current",
                prompt: trimmedPrompt,
              }).catch(() => undefined)
            : Promise.resolve(undefined);

        const storeMap = await storeMapPromise;

        if (signal.aborted) return;

        const answerStoreMap = storeMap ?? assistantMessage.storeMap;

        if (answerStoreMap) {
          if (shouldCacheStoreMapForPrompt(trimmedPrompt, answerStoreMap)) {
            chatStoreMapCache.save(assistantMessage.id, answerStoreMap);
          }
        }

        const nextAssistantMessage = normalizeStoreMapMessageForPrompt(
          storeMap ? { ...assistantMessage, storeMap } : assistantMessage,
          trimmedPrompt,
        );

        await textReveal.finish(nextAssistantMessage.content);

        if (!signal.aborted) focusChatInput();

        setMessages((currentMessages) => [
          ...currentMessages,
          nextAssistantMessage,
        ]);

        if (isAuthenticated) void refreshChatSessions();
      } catch (error) {
        textReveal.cancel();

        if (signal.aborted) return;

        console.error("Chat API request failed", error);
        const fallbackMessage =
          await createFallbackAssistantMessage(trimmedPrompt);

        if (signal.aborted) return;

        setMessages((currentMessages) => [...currentMessages, fallbackMessage]);
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
      setCurrentChatTitle,
      setCurrentGuestId,
      setCurrentSessionId,
      setMessages,
      setSessionTitles,
      setStreamingReply,
    ],
  );

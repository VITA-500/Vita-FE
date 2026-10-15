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
import { ApiError } from "@/shared/api/http";

type SubmitChatPromptOptions = {
  /** 이 메시지부터 뒤를 지우고 새 질문으로 다시 묻는다(질문 수정 · 다시 시도). */
  replaceFromMessageId?: string;
};

type UseChatPromptSubmitParams = {
  answerAbortRef: RefObject<AbortController | null>;
  chatInput: string;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
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

const hasNamedPlace = (prompt: string) =>
  /[가-힣]+역|[가-힣]+동|[가-힣]+구/.test(prompt) ||
  /[가-힣]{2,}\s*(?:근처|주변|제휴\s*매장|통신\s*매장|매장)/.test(prompt);

const declinesStoreLookup = (content: string) =>
  /제공된.*정보.*없|확인할 수 있는 정보.*없|위치 정보.*없|정확한 안내.*어렵|확인.*어렵|고객센터/.test(
    content,
  );

const storeAlternative = (prompt: string) => {
  const place =
    prompt.match(/[가-힣]+역|[가-힣]+동|[가-힣]+구/)?.[0] ??
    prompt.match(/[가-힣]{2,}(?=\s*(?:근처|주변|제휴|통신|매장))/)?.[0] ??
    "현재 위치";
  return /오전|오후|\d+\s*시|영업|운영/.test(prompt)
    ? `${place} 기준 가까운 매장만 우선 보여드릴까요? 시간 조건을 변경해 주시면 다시 찾아드릴 수 있어요.`
    : `${place} 기준 가까운 매장만 우선 보여드릴까요? 업종 조건을 바꿔 다시 찾아드릴 수 있어요.`;
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
        // 역·동네 등 장소가 명시된 질문은 현재 위치 fallback으로 덮어쓰면 안 된다.
        const hasNamedPlacePrompt = hasNamedPlace(trimmedPrompt);
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
          ) &&
          assistantMessage.storeMap?.originSource !== "place" &&
          !hasNamedPlacePrompt;
        const shouldFindPhoneStores =
          location &&
          // BE가 이전 대화의 매장 결과를 재사용해도 현재 질문의 위치 기준 결과가 우선이다.
          shouldUseLocalStoreFallback(trimmedPrompt) &&
          assistantMessage.storeMap?.originSource !== "place" &&
          !hasNamedPlacePrompt;
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

        // LLM이 매장 정보를 확인하지 못했다고 답한 경우, 이전 결과나 응답에 남은
        // storeMap을 함께 보여주면 거절 문구와 엉뚱한 카드가 동시에 노출된다.
        const answerDeclinesStoreLookup = declinesStoreLookup(
          assistantMessage.content,
        );

        // 새 매장 질문에 이전 답변의 지도를 재사용하면 선릉역 등 이전 결과가 남는다.
        // 현재 질문에서 다시 조회하지 못한 경우에도 오래된 지도는 표시하지 않는다.
        const answerStoreMap = answerDeclinesStoreLookup
          ? undefined
          : assistantMessage.storeMap?.originSource === "place"
            ? assistantMessage.storeMap
            : (storeMap ??
              (isStorePrompt ? undefined : assistantMessage.storeMap));

        const nextContent =
          isStorePrompt && !answerStoreMap
            ? `${assistantMessage.content.trim()}\n\n${storeAlternative(trimmedPrompt)}`
            : assistantMessage.content;

        if (answerStoreMap) {
          if (shouldCacheStoreMapForPrompt(trimmedPrompt, answerStoreMap)) {
            chatStoreMapCache.save(assistantMessage.id, answerStoreMap);
          }
        }

        const nextAssistantMessage = normalizeStoreMapMessageForPrompt(
          answerStoreMap
            ? {
                ...assistantMessage,
                content: nextContent,
                storeMap: answerStoreMap,
              }
            : { ...assistantMessage, content: nextContent },
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

        console.error("Chat API request failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          status: error instanceof ApiError ? error.status : undefined,
        });
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

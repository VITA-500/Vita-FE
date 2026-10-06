"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chatConversationStorage,
  createGuestId,
  getChatConversationOwnerKey,
  getGuestChatConversationOwnerKey,
} from "@/features/chat/lib/chatConversationStorage";
import {
  chatService,
  isPermanentClaimError,
} from "@/features/chat/lib/chatService";
import {
  createFallbackAssistantMessage,
  isStoreRelatedPrompt,
  toChatMessage,
  toChatTitle,
} from "@/features/chat/lib/chatMessages";
import { createChatStoreMap } from "@/features/chat/lib/chatStoreMap";
import { useChatSessionList } from "@/features/chat/hooks/useChatSessionList";
import type {
  ChatMessage,
  ChatMode,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { showToast } from "@/shared/ui/ToastProvider";

type UseChatConversationControllerParams = {
  activeMode: ChatMode;
  currentUserId?: number;
  hasUser: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  onRequireChatMode: () => void;
};

export const useChatConversationController = ({
  activeMode,
  currentUserId,
  hasUser,
  isAuthenticated,
  isAuthReady,
  onRequireChatMode,
}: UseChatConversationControllerParams) => {
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [currentGuestId, setCurrentGuestId] = useState<string | undefined>();
  const [currentSessionId, setCurrentSessionId] = useState<
    number | undefined
  >();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const {
    chatSessions,
    clearChatSessions,
    hasLoadedRecentChats,
    refreshChatSessions,
    sessionTitles,
    setSessionTitles,
  } = useChatSessionList(isAuthenticated);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldJumpToBottomRef = useRef(false);
  const latestSelectRequestRef = useRef(0);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationOwnerKeyRef = useRef("");
  const hasHydratedConversationRef = useRef(false);
  const hasChatStarted = messages.length > 0;

  const applyChatSession = useCallback(
    (response: SessionMessagesResponse) => {
      const nextMessages = response.messages.map(toChatMessage);
      const firstPrompt = response.messages.find(
        (message) => message.role === "USER" && message.content,
      )?.content;

      shouldJumpToBottomRef.current = true;
      setCurrentSessionId(response.sessionId);
      setCurrentGuestId(undefined);
      setMessages(nextMessages);
      setCurrentChatTitle(firstPrompt ? toChatTitle(firstPrompt) : "");
      if (firstPrompt) {
        setSessionTitles((titles) => ({
          ...titles,
          [response.sessionId]: toChatTitle(firstPrompt),
        }));
      }
      setChatStatus("idle");
    },
    [setSessionTitles],
  );

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let isCancelled = false;

    const hydrateConversation = async () => {
      const ownerKey = getChatConversationOwnerKey(
        currentUserId === undefined ? null : { userId: currentUserId },
      );
      let nextConversation = chatConversationStorage.load(ownerKey);

      if (currentUserId !== undefined) {
        const guestConversation =
          chatConversationStorage.load(getGuestChatConversationOwnerKey()) ??
          chatConversationStorage.loadGuestBackup();

        if (guestConversation?.messages.length) {
          nextConversation = guestConversation;
        }

        if (guestConversation?.sessionId && guestConversation.guestId) {
          await chatService
            .claimGuestSession(
              guestConversation.sessionId,
              guestConversation.guestId,
            )
            .then((response) => {
              console.info("Guest chat claim succeeded", {
                guestId: guestConversation.guestId,
                response,
                sessionId: guestConversation.sessionId,
              });
              if (!isCancelled) {
                showToast("로그인 전 상담 내역을 계정에 저장했어요.");
              }
              nextConversation = {
                ...guestConversation,
                guestId: undefined,
                sessionId: response.sessionId,
              };
              chatConversationStorage.save(ownerKey, nextConversation);
              chatConversationStorage.clear(getGuestChatConversationOwnerKey());
            })
            .catch((error) => {
              console.error("Guest chat claim failed", {
                error,
                guestId: guestConversation.guestId,
                sessionId: guestConversation.sessionId,
              });

              if (isPermanentClaimError(error)) {
                chatConversationStorage.clear(
                  getGuestChatConversationOwnerKey(),
                );
              }

              if (isCancelled) {
                return;
              }

              showToast(
                "로그인 전 상담 화면은 유지했지만 저장 연동은 실패했어요.",
              );
              nextConversation = {
                ...guestConversation,
                guestId: undefined,
                sessionId: undefined,
              };
              chatConversationStorage.save(ownerKey, nextConversation);
            });
        }

        void refreshChatSessions();
      } else {
        clearChatSessions();
      }

      if (isCancelled) {
        return;
      }

      activeConversationOwnerKeyRef.current = ownerKey;
      hasHydratedConversationRef.current = true;

      const frameId = window.requestAnimationFrame(() => {
        setMessages(nextConversation?.messages ?? []);
        setCurrentChatTitle(nextConversation?.title ?? "");
        setCurrentGuestId(
          currentUserId !== undefined ? undefined : nextConversation?.guestId,
        );
        setCurrentSessionId(nextConversation?.sessionId);
        setChatStatus("idle");
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    };

    let cancelFrame: (() => void) | undefined;

    void hydrateConversation().then((nextCancelFrame) => {
      cancelFrame = nextCancelFrame;
    });

    return () => {
      isCancelled = true;
      cancelFrame?.();
    };
  }, [clearChatSessions, currentUserId, isAuthReady, refreshChatSessions]);

  useEffect(() => {
    if (!hasHydratedConversationRef.current) {
      return;
    }

    const ownerKey = activeConversationOwnerKeyRef.current;

    if (!ownerKey) {
      return;
    }

    chatConversationStorage.save(ownerKey, {
      guestId: currentGuestId,
      messages,
      sessionId: currentSessionId,
      title: currentChatTitle,
    });
  }, [currentChatTitle, currentGuestId, currentSessionId, messages]);

  useEffect(() => {
    if (activeMode !== "chat" || messages.length === 0) return;

    const behavior: ScrollBehavior = shouldJumpToBottomRef.current
      ? "auto"
      : "smooth";
    shouldJumpToBottomRef.current = false;

    window.requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      window.requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      });
    });
  }, [activeMode, chatStatus, messages]);

  const submitChatPrompt = async (prompt: string = chatInput) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || chatStatus === "loading") return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      createdAt: new Date().toISOString(),
    };

    if (!currentChatTitle) {
      setCurrentChatTitle(toChatTitle(trimmedPrompt));
    }

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setChatInput("");
    setChatStatus("loading");
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

      const assistantMessage = await chatService.sendMessage({
        content: trimmedPrompt,
        guestId: nextGuestId,
        sessionId: nextSessionId,
      });
      const storeMap =
        isStoreRelatedPrompt(trimmedPrompt) && !assistantMessage.storeMap
          ? await createChatStoreMap(trimmedPrompt).catch(() => undefined)
          : undefined;

      setMessages((currentMessages) => [
        ...currentMessages,
        storeMap ? { ...assistantMessage, storeMap } : assistantMessage,
      ]);

      if (isAuthenticated) {
        void refreshChatSessions();
      }
    } catch (error) {
      console.error("Chat API request failed", error);
      const fallbackMessage =
        await createFallbackAssistantMessage(trimmedPrompt);

      setMessages((currentMessages) => [...currentMessages, fallbackMessage]);
    } finally {
      setChatStatus("idle");
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  };

  const resetChat = () => {
    latestSelectRequestRef.current += 1;
    setLoadingSessionId(null);
    setMessages([]);
    setChatInput("");
    setCurrentChatTitle("");
    setCurrentGuestId(undefined);
    setCurrentSessionId(undefined);
    setChatStatus("idle");
    chatConversationStorage.clear(activeConversationOwnerKeyRef.current);
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const startNewChat = () => {
    resetChat();

    if (activeMode !== "chat") {
      onRequireChatMode();
    }
  };

  const handleSelectChat = async (targetSessionId: number) => {
    if (activeMode !== "chat") {
      onRequireChatMode();
    }

    if (
      targetSessionId === currentSessionId ||
      targetSessionId === loadingSessionId ||
      chatStatus === "loading"
    ) {
      return;
    }

    const requestId = latestSelectRequestRef.current + 1;
    latestSelectRequestRef.current = requestId;
    setLoadingSessionId(targetSessionId);

    try {
      const loaded = await chatService.getMessages(targetSessionId);

      if (latestSelectRequestRef.current !== requestId) return;

      if (loaded.messages.length === 0) {
        showToast("저장된 대화가 없는 상담이에요.");
        return;
      }

      applyChatSession(loaded);
    } catch {
      if (latestSelectRequestRef.current !== requestId) return;
      showToast("상담 내역을 불러오지 못했어요.");
    } finally {
      if (latestSelectRequestRef.current === requestId) {
        setLoadingSessionId(null);
      }
    }
  };

  return {
    chatInput,
    chatInputRef,
    chatSessions,
    chatStatus,
    currentChatTitle,
    currentSessionId,
    handleSelectChat,
    hasChatStarted,
    hasLoadedRecentChats,
    loadingSessionId,
    messages,
    scrollContainerRef,
    sessionTitles,
    setChatInput,
    startNewChat,
    submitChatPrompt,
  };
};

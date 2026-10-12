"use client";

import {
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  chatConversationStorage,
  getChatConversationOwnerKey,
  getGuestChatConversationOwnerKey,
} from "@/features/chat/lib/chatConversationStorage";
import {
  chatService,
  isPermanentClaimError,
} from "@/features/chat/lib/chatService";
import { toChatMessage, toChatTitle } from "@/features/chat/lib/chatMessages";
import { restoreCachedStoreMaps } from "@/features/chat/lib/chatStoreMapCache";
import type {
  ChatMessage,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { showToast } from "@/shared/ui/ToastProvider";

type MutableRef<T> = { current: T };

type UseChatConversationHydrationParams = {
  activeConversationOwnerKeyRef: MutableRef<string>;
  clearChatSessions: () => void;
  currentChatTitle: string;
  currentGuestId?: string;
  currentSessionId?: number;
  currentUserId?: number;
  hasHydratedConversationRef: MutableRef<boolean>;
  isAuthReady: boolean;
  messages: ChatMessage[];
  refreshChatSessions: () => Promise<void>;
  setChatStatus: (status: "idle") => void;
  setCurrentChatTitle: (title: string) => void;
  setCurrentGuestId: (guestId?: string) => void;
  setCurrentSessionId: (sessionId?: number) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setSessionTitles: Dispatch<SetStateAction<Record<number, string>>>;
  shouldJumpToBottomRef: MutableRef<boolean>;
};

export const useChatConversationHydration = ({
  activeConversationOwnerKeyRef,
  clearChatSessions,
  currentChatTitle,
  currentGuestId,
  currentSessionId,
  currentUserId,
  hasHydratedConversationRef,
  isAuthReady,
  messages,
  refreshChatSessions,
  setChatStatus,
  setCurrentChatTitle,
  setCurrentGuestId,
  setCurrentSessionId,
  setMessages,
  setSessionTitles,
  shouldJumpToBottomRef,
}: UseChatConversationHydrationParams) => {
  const applyChatSession = useCallback(
    (response: SessionMessagesResponse) => {
      const nextMessages = restoreCachedStoreMaps(
        response.messages.map(toChatMessage),
      );
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
    [
      setChatStatus,
      setCurrentChatTitle,
      setCurrentGuestId,
      setCurrentSessionId,
      setMessages,
      setSessionTitles,
      shouldJumpToBottomRef,
    ],
  );

  useEffect(() => {
    if (!isAuthReady) return;

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

              if (isCancelled) return;

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

      if (isCancelled) return;

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

      return () => window.cancelAnimationFrame(frameId);
    };

    let cancelFrame: (() => void) | undefined;

    void hydrateConversation().then((nextCancelFrame) => {
      cancelFrame = nextCancelFrame;
    });

    return () => {
      isCancelled = true;
      cancelFrame?.();
    };
  }, [
    activeConversationOwnerKeyRef,
    clearChatSessions,
    currentUserId,
    hasHydratedConversationRef,
    isAuthReady,
    refreshChatSessions,
    setChatStatus,
    setCurrentChatTitle,
    setCurrentGuestId,
    setCurrentSessionId,
    setMessages,
  ]);

  useEffect(() => {
    if (!hasHydratedConversationRef.current) return;

    const ownerKey = activeConversationOwnerKeyRef.current;

    if (!ownerKey) return;

    chatConversationStorage.save(ownerKey, {
      guestId: currentGuestId,
      messages,
      sessionId: currentSessionId,
      title: currentChatTitle,
    });
  }, [
    activeConversationOwnerKeyRef,
    currentChatTitle,
    currentGuestId,
    currentSessionId,
    hasHydratedConversationRef,
    messages,
  ]);

  return { applyChatSession };
};

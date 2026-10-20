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
} from "@/features/chat/conversation/lib/chatConversationStorage";
import {
  chatService,
  isPermanentClaimError,
} from "@/features/chat/lib/chatService";
import {
  toChatMessage,
  toChatTitle,
} from "@/features/chat/conversation/lib/chatMessages";
import { toSafeTitleText } from "@/features/chat/sidebar/lib/chatTitleMask";
import type {
  ChatMessage,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/providers/ToastProvider";

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
              // guestId는 게스트 상담을 여는 열쇠라 로그에 남기지 않는다.
              console.error("Guest chat claim failed", {
                name: error instanceof Error ? error.name : "UnknownError",
                sessionId: guestConversation.sessionId,
                status: error instanceof ApiError ? error.status : undefined,
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

      // 새로고침하면 localStorage에는 스트리밍 중인 assistant 답변이 저장되지 않을 수 있다.
      // 현재 세션을 서버에서 다시 읽어 PENDING/COMPLETED 상태와 답변 내용을 복원한다.
      if (nextConversation?.sessionId) {
        try {
          const serverConversation = await chatService.getMessages(
            nextConversation.sessionId,
            nextConversation.guestId,
          );

          if (!isCancelled) {
            nextConversation = {
              ...nextConversation,
              messages: serverConversation.messages.map(toChatMessage),
            };
          }
        } catch (error) {
          // 서버를 잠시 조회하지 못해도 localStorage의 마지막 화면은 유지한다.
          console.warn("Chat conversation restore failed", {
            name: error instanceof Error ? error.name : "UnknownError",
            status: error instanceof ApiError ? error.status : undefined,
            sessionId: nextConversation.sessionId,
          });
        }
      }

      if (isCancelled) return;

      activeConversationOwnerKeyRef.current = ownerKey;
      hasHydratedConversationRef.current = true;

      const frameId = window.requestAnimationFrame(() => {
        setMessages(nextConversation?.messages ?? []);
        // 예전에 저장된 제목은 가리기 전 값일 수 있어 불러올 때 한 번 더 가린다.
        setCurrentChatTitle(toSafeTitleText(nextConversation?.title ?? ""));
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

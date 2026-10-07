"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  createStoppedAssistantMessage,
  isStoreRelatedPrompt,
  toChatMessage,
  toChatTitle,
} from "@/features/chat/lib/chatMessages";
import { createChatStoreMap } from "@/features/chat/lib/chatStoreMap";
import { createTextReveal } from "@/features/chat/lib/chatTextReveal";
import { useChatSessionList } from "@/features/chat/hooks/useChatSessionList";
import { useChatSessionPreferences } from "@/features/chat/hooks/useChatSessionPreferences";
import type {
  ChatMessage,
  ChatMode,
  ChatStreamingReply,
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
  const [streamingReply, setStreamingReply] =
    useState<ChatStreamingReply | null>(null);
  /** 기다리는 중인 답변 요청. 새 대화를 시작하면 끊어서 이전 답변이 섞이지 않게 한다. */
  const answerAbortRef = useRef<AbortController | null>(null);
  /** 답변을 중단한 직후 "질문 수정" 툴팁을 잠깐 띄울 질문 메시지 id */
  const [editHintMessageId, setEditHintMessageId] = useState<string | null>(
    null,
  );
  const editHintTimeoutRef = useRef<number | undefined>(undefined);
  const {
    chatSessions: serverChatSessions,
    clearChatSessions,
    hasLoadedRecentChats,
    refreshChatSessions,
    sessionTitles,
    setSessionTitles,
  } = useChatSessionList(isAuthenticated);
  const {
    deletedSessionIds,
    markDeleted: markSessionDeleted,
    pinnedSessionIds,
    togglePin: togglePinChatSession,
  } = useChatSessionPreferences(isAuthenticated ? currentUserId : undefined);
  // 삭제한 상담은 BE 기록이 남아 있어도 목록에서 뺀다.
  const chatSessions = useMemo(
    () =>
      serverChatSessions.filter(
        (session) => !deletedSessionIds.includes(session.sessionId),
      ),
    [deletedSessionIds, serverChatSessions],
  );
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
    return () => {
      answerAbortRef.current?.abort();
      window.clearTimeout(editHintTimeoutRef.current);
    };
  }, []);

  const clearEditHint = useCallback(() => {
    window.clearTimeout(editHintTimeoutRef.current);
    setEditHintMessageId(null);
  }, []);

  const isStreamingAnswer = Boolean(streamingReply?.content);

  useEffect(() => {
    if (activeMode !== "chat" || messages.length === 0) return;

    const container = scrollContainerRef.current;

    // 답변이 글자 단위로 늘어나는 동안에는 사용자가 위로 스크롤해 읽고 있으면 끌어내리지 않는다.
    if (
      isStreamingAnswer &&
      container &&
      container.scrollHeight - container.scrollTop - container.clientHeight >
        160
    ) {
      return;
    }

    const behavior: ScrollBehavior =
      shouldJumpToBottomRef.current || isStreamingAnswer ? "auto" : "smooth";
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
  }, [activeMode, chatStatus, isStreamingAnswer, messages, streamingReply]);

  type SubmitChatPromptOptions = {
    /** 이 메시지부터 뒤를 지우고 새 질문으로 다시 묻는다(질문 수정 · 다시 시도). */
    replaceFromMessageId?: string;
  };

  const submitChatPrompt = async (
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

    if (!currentChatTitle) {
      setCurrentChatTitle(toChatTitle(trimmedPrompt));
    }

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
    // 질문 수정 · 다시 시도는 입력창에 쓰던 글을 건드리지 않는다.
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

      const assistantMessage = await chatService.sendMessage({
        content: trimmedPrompt,
        guestId: nextGuestId,
        sessionId: nextSessionId,
        signal,
        onStage: (stage) => {
          if (signal.aborted) return;
          setStreamingReply((reply) => ({ content: "", ...reply, stage }));
        },
        onDelta: (content) => {
          if (signal.aborted) return;
          textReveal.push(content);
        },
      });
      const [storeMap] = await Promise.all([
        isStoreRelatedPrompt(trimmedPrompt) && !assistantMessage.storeMap
          ? createChatStoreMap(trimmedPrompt).catch(() => undefined)
          : undefined,
        // 화면에 덜 풀린 글이 남아 있으면 끝까지 보여준 뒤 최종 메시지로 바꾼다(마지막에 한 번에 붙는 현상 방지).
        textReveal.finish(assistantMessage.content),
      ]);

      if (signal.aborted) return;

      setMessages((currentMessages) => [
        ...currentMessages,
        storeMap ? { ...assistantMessage, storeMap } : assistantMessage,
      ]);

      if (isAuthenticated) {
        void refreshChatSessions();
      }
    } catch (error) {
      textReveal.cancel();

      if (signal.aborted) return;

      console.error("Chat API request failed", error);
      const fallbackMessage =
        await createFallbackAssistantMessage(trimmedPrompt);

      if (signal.aborted) return;

      setMessages((currentMessages) => [...currentMessages, fallbackMessage]);
    } finally {
      // 새 대화 시작 등으로 끊긴 요청이면 이미 다음 상태로 넘어갔으니 건드리지 않는다.
      if (answerAbortRef.current === answerController) {
        answerAbortRef.current = null;
        setStreamingReply(null);
        setChatStatus("idle");
        window.requestAnimationFrame(() => chatInputRef.current?.focus());
      }
    }
  };

  /**
   * 답변 생성을 중단한다. 그때까지 받은 글은 남기고, 질문에는 수정 버튼(펜)을 띄워
   * 고쳐서 다시 물어볼 수 있게 한다.
   * BE에 취소 API가 없어 서버에서는 답변 생성이 계속될 수 있다(기록을 다시 열면 보일 수 있음).
   */
  const stopChatAnswer = () => {
    const answerController = answerAbortRef.current;

    if (!answerController || chatStatus !== "loading") return;

    answerAbortRef.current = null;
    answerController.abort();

    const partialContent = streamingReply?.content ?? "";
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    setStreamingReply(null);
    setChatStatus("idle");
    setMessages((currentMessages) => [
      ...currentMessages,
      createStoppedAssistantMessage(partialContent),
    ]);

    if (lastUserMessage) {
      window.clearTimeout(editHintTimeoutRef.current);
      setEditHintMessageId(lastUserMessage.id);
      editHintTimeoutRef.current = window.setTimeout(
        () => setEditHintMessageId(null),
        4000,
      );
    }
  };

  /** 질문을 고쳐서 다시 답변을 요청한다. 고친 질문 뒤의 메시지(중단·실패한 답변)는 지운다. */
  const editAndResubmitPrompt = (userMessageId: string, prompt: string) => {
    void submitChatPrompt(prompt, { replaceFromMessageId: userMessageId });
  };

  /** 실패한 답변을 같은 질문으로 다시 요청한다. */
  const retryAnswer = (assistantMessageId: string) => {
    const assistantIndex = messages.findIndex(
      ({ id }) => id === assistantMessageId,
    );
    const userMessage = messages
      .slice(0, Math.max(assistantIndex, 0))
      .reverse()
      .find((message) => message.role === "user");

    if (assistantIndex < 0 || !userMessage) return;

    void submitChatPrompt(userMessage.content, {
      replaceFromMessageId: userMessage.id,
    });
  };

  const resetChat = () => {
    clearEditHint();
    answerAbortRef.current?.abort();
    answerAbortRef.current = null;
    setStreamingReply(null);
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

  const deleteChatSession = (targetSessionId: number) => {
    markSessionDeleted(targetSessionId);

    // 보고 있거나 불러오는 중인 상담을 지우면 빈 새 상담으로 돌아간다.
    if (
      targetSessionId === currentSessionId ||
      targetSessionId === loadingSessionId
    ) {
      resetChat();
    }

    showToast("상담을 삭제했어요.");
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
    deleteChatSession,
    editAndResubmitPrompt,
    editHintMessageId,
    handleSelectChat,
    hasChatStarted,
    hasLoadedRecentChats,
    loadingSessionId,
    messages,
    pinnedSessionIds,
    retryAnswer,
    scrollContainerRef,
    sessionTitles,
    setChatInput,
    startNewChat,
    stopChatAnswer,
    streamingReply,
    submitChatPrompt,
    togglePinChatSession,
  };
};

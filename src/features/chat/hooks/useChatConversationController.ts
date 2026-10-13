"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatConversationStorage } from "@/features/chat/lib/chatConversationStorage";
import { chatService } from "@/features/chat/lib/chatService";
import { createStoppedAssistantMessage } from "@/features/chat/lib/chatMessages";
import {
  findUserMessageBeforeAssistant,
  getLastUserMessage,
} from "@/features/chat/lib/chatConversationFlow";
import { useChatAnswerFeedback } from "@/features/chat/hooks/useChatAnswerFeedback";
import { useChatAutoScroll } from "@/features/chat/hooks/useChatAutoScroll";
import { useChatSessionList } from "@/features/chat/hooks/useChatSessionList";
import { useChatSessionPreferences } from "@/features/chat/hooks/useChatSessionPreferences";
import { useChatConversationHydration } from "@/features/chat/hooks/useChatConversationHydration";
import { useChatPromptSubmit } from "@/features/chat/hooks/useChatPromptSubmit";
import type {
  ChatFeedback,
  ChatMessage,
  ChatMode,
  ChatStreamingReply,
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
  const latestSelectRequestRef = useRef(0);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationOwnerKeyRef = useRef("");
  const hasHydratedConversationRef = useRef(false);
  const hasChatStarted = messages.length > 0;
  const { feedbackMessageIds, sendAnswerFeedback } = useChatAnswerFeedback({
    isAuthenticated,
    messages,
    setMessages,
  });

  /**
   * 답변 피드백(회원 전용). 관리자 전달은 BE가 피드백 API 안에서 처리한다:
   * "아쉬워요"(DISLIKE)면 관리자 답변 피드백 목록에 올리고, "좋아요"로 바꾸거나 취소하면 내린다.
   * 그래서 FE는 피드백만 보내고, "아쉬워요"를 새로 눌렀을 때만 감사 토스트를 띄운다.
   */
  const submitAnswerFeedback = async (
    assistantMessageId: string,
    feedback: ChatFeedback,
  ) => {
    if (!isAuthenticated) return;

    const target = messages.find(
      (message) => message.id === assistantMessageId,
    );
    const isNewDislike =
      feedback === "DISLIKE" && target?.feedback !== "DISLIKE";

    if (!isNewDislike) {
      await sendAnswerFeedback(assistantMessageId, feedback);
      return;
    }

    const savedFeedback = await sendAnswerFeedback(
      assistantMessageId,
      feedback,
      { silent: true },
    );

    showToast(
      savedFeedback === "DISLIKE"
        ? "소중한 의견 감사합니다. 더 나은 답변을 만드는 데 참고할게요."
        : "의견을 전달하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  };
  const { scrollContainerRef, shouldJumpToBottomRef } = useChatAutoScroll({
    activeMode,
    chatStatus,
    messages,
    streamingReply,
  });

  const { applyChatSession } = useChatConversationHydration({
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
  });

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

  /**
   * 답변을 다 보여준 뒤 바로 이어서 입력할 수 있게 입력창에 포커스를 준다.
   * 검색창·확인 창처럼 다른 입력을 쓰는 중이면 빼앗지 않는다.
   */
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
    ) {
      return;
    }

    input.focus({ preventScroll: true });
  }, []);

  // 답변이 끝나 입력 가능 상태(loading → idle)가 되면 화면이 다시 그려진 뒤 포커스를 준다.
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

  const submitChatPrompt = useChatPromptSubmit({
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
  });

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
    const lastUserMessage = getLastUserMessage(messages);

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
    const userMessage = findUserMessageBeforeAssistant(
      messages,
      assistantMessageId,
    );

    if (!userMessage) return;

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
    feedbackMessageIds,
    handleSelectChat,
    hasChatStarted,
    hasLoadedRecentChats,
    loadingSessionId,
    messages,
    pinnedSessionIds,
    retryAnswer,
    scrollContainerRef,
    sessionTitles,
    sendAnswerFeedback: submitAnswerFeedback,
    setChatInput,
    startNewChat,
    stopChatAnswer,
    streamingReply,
    submitChatPrompt,
    togglePinChatSession,
  };
};

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
import { useChatConversationHydration } from "@/features/chat/hooks/useChatConversationHydration";
import { useChatPromptSubmit } from "@/features/chat/hooks/useChatPromptSubmit";
import { useChatInputFocus } from "@/features/chat/hooks/useChatInputFocus";
import type {
  ChatConversationStatus,
  ChatFeedback,
  ChatMessage,
  ChatMode,
  ChatStreamingReply,
} from "@/features/chat/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/providers/ToastProvider";

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
  const [conversationStatus, setConversationStatus] =
    useState<ChatConversationStatus>("idle");
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
    removeChatSession,
    refreshChatSessions,
    sessionTitles,
    setChatSessionPinned,
    setChatSessionTitle,
    setSessionTitles,
  } = useChatSessionList(isAuthenticated);
  const pinnedSessionIds = useMemo(
    () =>
      serverChatSessions
        .filter((session) => session.pinned)
        .map((session) => session.sessionId),
    [serverChatSessions],
  );
  const chatSessions = serverChatSessions;
  const latestSelectRequestRef = useRef(0);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
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

  const resetConversationStatus = useCallback(() => {
    answerAbortRef.current?.abort();
    answerAbortRef.current = null;
    setStreamingReply(null);
    setChatStatus("idle");
    setConversationStatus("idle");
  }, []);

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
    setChatStatus: resetConversationStatus,
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

  const { focusChatInput } = useChatInputFocus({
    activeMode,
    chatInputRef,
    chatStatus,
  });

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
    setConversationStatus,
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
    setConversationStatus("idle");
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

  /** 실패하거나 중단된 답변을 같은 질문으로 다시 요청한다. */
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
    setConversationStatus("idle");
    chatConversationStorage.clear(activeConversationOwnerKeyRef.current);
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const startNewChat = () => {
    resetChat();

    if (activeMode !== "chat") {
      onRequireChatMode();
    }
  };

  const deleteChatSession = async (targetSessionId: number) => {
    try {
      await chatService.deleteSession(targetSessionId);
      removeChatSession(targetSessionId);

      // 보고 있거나 불러오는 중인 상담을 지우면 빈 새 상담으로 돌아간다.
      if (
        targetSessionId === currentSessionId ||
        targetSessionId === loadingSessionId
      ) {
        resetChat();
      }

      showToast("상담을 삭제했어요.");
    } catch {
      showToast("상담을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const togglePinChatSession = async (targetSessionId: number) => {
    const nextPinned = !pinnedSessionIds.includes(targetSessionId);

    setChatSessionPinned(targetSessionId, nextPinned);

    try {
      const response = await chatService.updateSessionPin(
        targetSessionId,
        nextPinned,
      );

      setChatSessionPinned(targetSessionId, response.pinned);
    } catch {
      setChatSessionPinned(targetSessionId, !nextPinned);
      showToast("상담 고정 상태를 바꾸지 못했어요.");
    }
  };

  const renameChatSession = async (targetSessionId: number, title: string) => {
    try {
      const response = await chatService.updateSessionTitle(
        targetSessionId,
        title,
      );

      setChatSessionTitle(response.sessionId, response.title);

      if (response.sessionId === currentSessionId) {
        setCurrentChatTitle(response.title);
      }

      showToast("상담 이름을 바꿨어요.");
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        showToast(error.message);
      } else if (error instanceof ApiError && error.status === 401) {
        window.dispatchEvent(new Event("vita-auth-changed"));
        showToast("로그인이 만료되었어요. 다시 로그인해 주세요.");
      } else {
        showToast("상담 이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      return false;
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
    conversationStatus,
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
    renameChatSession,
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

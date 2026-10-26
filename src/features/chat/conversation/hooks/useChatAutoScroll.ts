"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMode, ChatStreamingReply } from "@/features/chat/types";
import type { ChatMessage } from "@/entities/chat";

type UseChatAutoScrollParams = {
  activeMode: ChatMode;
  chatStatus: "idle" | "loading";
  messages: ChatMessage[];
  streamingReply?: ChatStreamingReply | null;
};

const getMessageScrollKey = (messages: ChatMessage[]) =>
  messages
    .map((message) =>
      [
        message.id,
        message.role,
        message.status ?? "success",
        message.content.length,
        message.storeMap ? "store" : "",
        message.actions?.length ?? 0,
      ].join(":"),
    )
    .join("|");

export const useChatAutoScroll = ({
  activeMode,
  chatStatus,
  messages,
  streamingReply,
}: UseChatAutoScrollParams) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldJumpToBottomRef = useRef(false);
  // 마지막으로 본 사용자 질문 id. 새 질문이 끝에 붙으면 읽던 위치와 상관없이 맨 아래로 보낸다.
  const lastUserMessageIdRef = useRef<string | null>(null);
  const isAtLatestRef = useRef(true);
  const [isAwayFromLatest, setIsAwayFromLatest] = useState(false);
  const isStreamingAnswer = Boolean(streamingReply?.content);
  const messageScrollKey = useMemo(
    () => getMessageScrollKey(messages),
    [messages],
  );
  const streamingScrollKey = `${streamingReply?.content.length ?? 0}:${
    streamingReply?.isPreparingBlock ? "block" : ""
  }`;

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) return;

    const handleScroll = () => {
      const isAtLatest =
        container.scrollHeight - container.scrollTop - container.clientHeight <=
        32;

      isAtLatestRef.current = isAtLatest;
      setIsAwayFromLatest((previous) =>
        previous === !isAtLatest ? previous : !isAtLatest,
      );
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeMode, messages.length]);

  useEffect(() => {
    if (activeMode !== "chat" || messages.length === 0) return;

    // 사용자가 새 질문을 보냈으면(끝 메시지가 처음 보는 사용자 질문) 이전 답변을 읽던 중이어도 맨 아래로 이동한다.
    // 상담을 불러온 직후(하이드레이션)에도 끝이 사용자 질문일 수 있지만, 그때도 맨 아래가 맞다.
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role === "user" &&
      lastMessage.id !== lastUserMessageIdRef.current
    ) {
      lastUserMessageIdRef.current = lastMessage.id;
      shouldJumpToBottomRef.current = true;
      isAtLatestRef.current = true;
      // "최신 대화 보기" 버튼 상태는 아래 scrollTo 뒤 scroll 이벤트에서 갱신된다.
    }

    if (!shouldJumpToBottomRef.current && !isAtLatestRef.current) {
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
  }, [
    activeMode,
    chatStatus,
    isStreamingAnswer,
    messageScrollKey,
    messages.length,
    streamingScrollKey,
  ]);

  const scrollToLatest = () => {
    isAtLatestRef.current = true;
    setIsAwayFromLatest(false);
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return {
    isAwayFromLatest,
    scrollContainerRef,
    scrollToLatest,
    shouldJumpToBottomRef,
  };
};

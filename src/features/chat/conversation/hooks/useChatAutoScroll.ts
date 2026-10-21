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

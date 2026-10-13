"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  ChatMessage,
  ChatMode,
  ChatStreamingReply,
} from "@/features/chat/types";

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
  const isStreamingAnswer = Boolean(streamingReply?.content);
  const messageScrollKey = useMemo(
    () => getMessageScrollKey(messages),
    [messages],
  );
  const streamingScrollKey = `${streamingReply?.content.length ?? 0}:${
    streamingReply?.isPreparingBlock ? "block" : ""
  }`;

  useEffect(() => {
    if (activeMode !== "chat" || messages.length === 0) return;

    const container = scrollContainerRef.current;

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
  }, [
    activeMode,
    chatStatus,
    isStreamingAnswer,
    messageScrollKey,
    messages.length,
    streamingScrollKey,
  ]);

  return { scrollContainerRef, shouldJumpToBottomRef };
};

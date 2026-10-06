import { useCallback, useRef, useState } from "react";
import { chatService } from "@/features/chat/lib/chatService";
import { toChatTitle } from "@/features/chat/lib/chatMessages";
import type { ChatSessionSummary } from "@/features/chat/types";

/** 사이드바 제목을 채우려고 상담 메시지를 동시에 조회하는 최대 개수. */
const TITLE_FETCH_CONCURRENCY = 4;
/** 최근 상담을 펼치기 전에 제목 조회를 기다리는 최대 시간. */
const TITLE_FETCH_WAIT_MS = 3000;

export const useChatSessionList = (isAuthenticated: boolean) => {
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [hasLoadedRecentChats, setHasLoadedRecentChats] = useState(false);
  const [sessionTitles, setSessionTitles] = useState<Record<number, string>>(
    {},
  );
  const requestedTitleSessionIdsRef = useRef<Set<number>>(new Set());

  const fillMissingSessionTitles = useCallback(
    async (sessions: readonly ChatSessionSummary[]) => {
      const targets = sessions.filter(
        (session) =>
          !session.title &&
          !requestedTitleSessionIdsRef.current.has(session.sessionId),
      );

      targets.forEach((session) =>
        requestedTitleSessionIdsRef.current.add(session.sessionId),
      );

      const queue = [...targets];
      const worker = async () => {
        for (let session = queue.shift(); session; session = queue.shift()) {
          try {
            const { messages } = await chatService.getMessages(
              session.sessionId,
            );
            const firstPrompt = messages.find(
              (message) => message.role === "USER" && message.content,
            )?.content;

            if (!firstPrompt) continue;

            const sessionId = session.sessionId;
            setSessionTitles((titles) =>
              titles[sessionId]
                ? titles
                : { ...titles, [sessionId]: toChatTitle(firstPrompt) },
            );
          } catch {
            requestedTitleSessionIdsRef.current.delete(session.sessionId);
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(TITLE_FETCH_CONCURRENCY, queue.length) },
          worker,
        ),
      );
    },
    [],
  );

  const refreshChatSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setChatSessions([]);
      return;
    }

    try {
      const { sessions } = await chatService.getSessions();
      setChatSessions(sessions);
      await Promise.race([
        fillMissingSessionTitles(sessions),
        new Promise((resolve) =>
          window.setTimeout(resolve, TITLE_FETCH_WAIT_MS),
        ),
      ]);
    } catch {
      setChatSessions([]);
    } finally {
      setHasLoadedRecentChats(true);
    }
  }, [fillMissingSessionTitles, isAuthenticated]);
  const clearChatSessions = useCallback(() => {
    setChatSessions([]);
  }, []);

  return {
    chatSessions,
    clearChatSessions,
    hasLoadedRecentChats,
    refreshChatSessions,
    sessionTitles,
    setSessionTitles,
  };
};

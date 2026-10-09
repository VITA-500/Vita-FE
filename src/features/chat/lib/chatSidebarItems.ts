import type { ChatSessionSummary } from "@/features/chat/types";

export type SidebarChatItem = {
  active: boolean;
  key: string;
  sessionId: number | null;
  title: string;
};

type BuildSidebarChatItemsParams = {
  activeSessionId?: number | null;
  currentChatTitle?: string;
  chatSessions?: readonly ChatSessionSummary[];
  pendingSessionId?: number | null;
  pinnedSessionIds?: readonly number[];
  sessionTitles?: Readonly<Record<number, string>>;
};

export const formatSessionTitle = (session: ChatSessionSummary) => {
  if (session.title) {
    return session.title;
  }

  const updatedAt = new Date(session.updatedAt);

  if (Number.isNaN(updatedAt.getTime())) {
    return `상담 #${session.sessionId}`;
  }

  return `${updatedAt.getMonth() + 1}월 ${updatedAt.getDate()}일 ${String(
    updatedAt.getHours(),
  ).padStart(2, "0")}:${String(updatedAt.getMinutes()).padStart(2, "0")} 상담`;
};

export const buildSidebarChatItems = ({
  activeSessionId = null,
  chatSessions = [],
  currentChatTitle,
  pendingSessionId = null,
  pinnedSessionIds = [],
  sessionTitles = {},
}: BuildSidebarChatItemsParams) => {
  const selectedSessionId = pendingSessionId ?? activeSessionId;
  const isViewingLoadedSession = pendingSessionId == null;
  const sessionChats: SidebarChatItem[] = chatSessions.map((session) => {
    const isActive = session.sessionId === selectedSessionId;
    const isShowingThisSession =
      isViewingLoadedSession && session.sessionId === activeSessionId;

    return {
      active: isActive,
      key: `session-${session.sessionId}`,
      sessionId: session.sessionId,
      title:
        (isShowingThisSession && currentChatTitle) ||
        sessionTitles[session.sessionId] ||
        formatSessionTitle(session),
    };
  });
  const hasActiveSessionInList = sessionChats.some((chat) => chat.active);
  const visibleRecentChats: SidebarChatItem[] =
    currentChatTitle && !hasActiveSessionInList && isViewingLoadedSession
      ? [
          {
            active: true,
            key:
              activeSessionId != null
                ? `session-${activeSessionId}`
                : "current-new",
            sessionId: activeSessionId,
            title: currentChatTitle,
          },
          ...sessionChats,
        ]
      : sessionChats;
  const isPinnedChat = (chat: SidebarChatItem) =>
    chat.sessionId !== null && pinnedSessionIds.includes(chat.sessionId);
  const pinnedChats = pinnedSessionIds
    .map((sessionId) =>
      visibleRecentChats.find((chat) => chat.sessionId === sessionId),
    )
    .filter((chat): chat is SidebarChatItem => Boolean(chat));
  const unpinnedRecentChats = visibleRecentChats.filter(
    (chat) => !isPinnedChat(chat),
  );

  return {
    isPinnedChat,
    pinnedChats,
    unpinnedRecentChats,
    visibleRecentChats,
  };
};

import { toSafeTitleText } from "@/features/chat/lib/chatTitleMask";
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

/**
 * 사이드바 상담 목록을 만든다.
 * - currentChat: 지금 화면에 열려 있는 상담. 회원·게스트 모두 보이며 "현재 상담" 구역에 따로 그린다.
 * - pinnedChats / unpinnedRecentChats: 회원 최근 상담. 현재 상담은 위 구역에 있으므로 여기서는 뺀다.
 * - visibleRecentChats: 메뉴(고정·삭제) 대상을 찾을 때 쓰는 전체 목록(현재 상담 포함).
 */
export const buildSidebarChatItems = ({
  activeSessionId = null,
  chatSessions = [],
  currentChatTitle,
  pendingSessionId = null,
  pinnedSessionIds = [],
  sessionTitles = {},
}: BuildSidebarChatItemsParams) => {
  const selectedSessionId = pendingSessionId ?? activeSessionId;
  // 다른 상담을 불러오는 중이면 응답이 올 때까지 현재 상담은 그대로 두고 선택 표시만 옮긴다.
  const isViewingLoadedSession = pendingSessionId == null;
  const sessionChats: SidebarChatItem[] = chatSessions.map((session) => ({
    active: session.sessionId === selectedSessionId,
    key: `session-${session.sessionId}`,
    sessionId: session.sessionId,
    title: toSafeTitleText(
      sessionTitles[session.sessionId] || formatSessionTitle(session),
    ),
  }));
  const currentChat: SidebarChatItem | null = currentChatTitle
    ? {
        active: isViewingLoadedSession,
        key:
          activeSessionId != null
            ? `session-${activeSessionId}`
            : "current-new",
        sessionId: activeSessionId,
        title: toSafeTitleText(currentChatTitle),
      }
    : null;
  const otherSessionChats = currentChat
    ? sessionChats.filter((chat) => chat.key !== currentChat.key)
    : sessionChats;
  const visibleRecentChats = currentChat
    ? [currentChat, ...otherSessionChats]
    : otherSessionChats;
  const isPinnedChat = (chat: SidebarChatItem) =>
    chat.sessionId !== null && pinnedSessionIds.includes(chat.sessionId);
  const pinnedChats = pinnedSessionIds
    .map((sessionId) =>
      otherSessionChats.find((chat) => chat.sessionId === sessionId),
    )
    .filter((chat): chat is SidebarChatItem => Boolean(chat));
  const unpinnedRecentChats = otherSessionChats.filter(
    (chat) => !isPinnedChat(chat),
  );

  return {
    currentChat,
    isPinnedChat,
    pinnedChats,
    unpinnedRecentChats,
    visibleRecentChats,
  };
};

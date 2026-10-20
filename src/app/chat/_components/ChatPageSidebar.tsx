"use client";

import { useRouter } from "next/navigation";
import type { ChatConversation } from "./chatPageTypes";
import type { useRailTooltip } from "../_hooks/useRailTooltip";
import { ChatSidebar } from "@/features/chat/sidebar/components/ChatSidebar";
import type { ChatMode } from "@/features/chat/types";
import { buildLoginHref, type useAuthUser } from "@/entities/user";
import { routes } from "@/shared/constants/routes";

type ChatPageSidebarProps = {
  activeMode: ChatMode;
  auth: ReturnType<typeof useAuthUser>;
  conversation: ChatConversation;
  isOpen: boolean;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onSetOpen: (isOpen: boolean) => void;
  onStartTour: () => void;
  tooltip: ReturnType<typeof useRailTooltip>;
};

/** 사이드바와 대화 상태·로그인·화면 이동을 연결한다. */
export const ChatPageSidebar = ({
  activeMode,
  auth,
  conversation,
  isOpen,
  onNewChat,
  onOpenSearch,
  onOpenSettings,
  onSetOpen,
  onStartTour,
  tooltip,
}: ChatPageSidebarProps) => {
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, isLoading, isReady } = auth;

  return (
    <ChatSidebar
      isAuthenticated={isAuthenticated}
      isAuthExpired={hasAccessToken && !isAuthenticated && isReady}
      isAuthLoading={isLoading}
      isAuthReady={isReady}
      isOpen={isOpen}
      onOpen={() => onSetOpen(true)}
      onClose={() => onSetOpen(false)}
      onOpenHome={() => router.push(routes.home)}
      onNewChat={onNewChat}
      // 로그인 후 지금 보던 화면(상담·매장 지도·마이페이지)으로 돌아온다.
      onOpenLogin={() =>
        router.push(
          buildLoginHref(
            `${window.location.pathname}${window.location.search}`,
          ),
        )
      }
      onOpenSearch={() => {
        tooltip.hideTooltip();
        onOpenSearch();
      }}
      onOpenProfile={() => {
        tooltip.hideTooltip();
        router.push(routes.myPage);
      }}
      onOpenSettings={() => {
        tooltip.hideTooltip();
        onOpenSettings();
      }}
      onStartTour={() => {
        tooltip.hideTooltip();
        onStartTour();
      }}
      onShowRailTooltip={tooltip.showRailTooltip}
      onShowHeaderTooltip={tooltip.showHeaderTooltip}
      onHideTooltip={tooltip.hideTooltip}
      activeMode={activeMode}
      currentChatTitle={conversation.currentChatTitle}
      chatSessions={conversation.chatSessions}
      pendingSessionId={conversation.loadingSessionId}
      activeSessionId={conversation.currentSessionId ?? null}
      sessionTitles={conversation.sessionTitles}
      isRecentChatsLoading={
        !isReady || (isAuthenticated && !conversation.hasLoadedRecentChats)
      }
      onSelectChat={(targetSessionId) => {
        void conversation.handleSelectChat(targetSessionId);
      }}
      onOpenCurrentChat={() => {
        tooltip.hideTooltip();

        // 길찾기 등 매장 지도에서 돌아올 때. 대화는 화면 상태·저장소에 그대로 있어 다시 불러오지 않는다.
        if (activeMode !== "chat") {
          router.replace(routes.chat);
        }
      }}
      isCurrentChatAnswering={conversation.chatStatus === "loading"}
      pinnedSessionIds={conversation.pinnedSessionIds}
      onTogglePinChat={conversation.togglePinChatSession}
      onRenameChat={conversation.renameChatSession}
      onDeleteChat={conversation.deleteChatSession}
    />
  );
};

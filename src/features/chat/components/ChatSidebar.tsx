"use client";

import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { ChatDeleteConfirmDialog } from "@/features/chat/components/ChatDeleteConfirmDialog";
import { ChatSessionList } from "@/features/chat/components/ChatSessionList";
import { ChatSessionMenu } from "@/features/chat/components/ChatSessionMenu";
import { ChatSidebarFooter } from "@/features/chat/components/ChatSidebarFooter";
import { ChatSidebarNav } from "@/features/chat/components/ChatSidebarNav";
import { useFloatingChatMenu } from "@/features/chat/hooks/useFloatingChatMenu";
import { usePointerDownOutside } from "@/features/chat/hooks/usePointerDownOutside";
import {
  buildSidebarChatItems,
  type SidebarChatItem,
} from "@/features/chat/lib/chatSidebarItems";
import type { ChatMode, ChatSessionSummary } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";

const sidebarClassName =
  "bg-surface-muted fixed inset-y-0 left-0 z-[100] flex overflow-hidden border-r border-gray-200 text-gray-950 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:text-white";
const sidebarIconButtonClassName =
  "flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white";

type ChatSidebarProps = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthReady: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenHome: () => void;
  onNewChat: () => void;
  onOpenLogin: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onStartTour: () => void;
  onShowRailTooltip: (
    label: string,
    shortcut?: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onShowHeaderTooltip: (
    label: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onHideTooltip: () => void;
  activeMode: ChatMode;
  currentChatTitle?: string;
  chatSessions?: readonly ChatSessionSummary[];
  /** 불러오는 중인 상담. 응답 전에도 사이드바에서 바로 선택 표시를 옮기기 위해 쓴다. */
  pendingSessionId?: number | null;
  activeSessionId?: number | null;
  /** 상담별 제목(첫 질문). BE 세션 title이 비어 있어 FE가 알게 된 제목을 넘겨받는다. */
  sessionTitles?: Readonly<Record<number, string>>;
  /** 최근 상담 목록(제목)을 아직 불러오는 중. 그동안은 목록을 접어 두고, 다 불러오면 펼친다. */
  isRecentChatsLoading?: boolean;
  onSelectChat?: (sessionId: number) => void;
  /** 고정한 상담 id(고정한 순서). */
  pinnedSessionIds?: readonly number[];
  onTogglePinChat?: (sessionId: number) => void;
  onDeleteChat?: (sessionId: number) => void;
};

export const ChatSidebar = ({
  activeMode,
  activeSessionId = null,
  chatSessions = [],
  currentChatTitle,
  isAuthLoading,
  isAuthReady,
  isAuthenticated,
  isOpen,
  onClose,
  onNewChat,
  onHideTooltip,
  onOpen,
  onOpenHome,
  onOpenLogin,
  onOpenProfile,
  onOpenSearch,
  onDeleteChat,
  onSelectChat,
  onTogglePinChat,
  pendingSessionId = null,
  pinnedSessionIds = [],
  onStartTour,
  sessionTitles = {},
  isRecentChatsLoading = false,
  onShowHeaderTooltip,
  onShowRailTooltip,
}: ChatSidebarProps) => {
  const { chatMenu, closeChatMenu, openChatMenu } = useFloatingChatMenu();
  const [deleteTargetChat, setDeleteTargetChat] =
    useState<SidebarChatItem | null>(null);
  const [isRecentChatsCollapsed, setIsRecentChatsCollapsed] = useState(false);
  // 사용자가 직접 접었는지(isRecentChatsCollapsed)와 불러오는 중인지를 합쳐 실제로 접어 보일지 정한다.
  const isRecentChatsHidden = isRecentChatsCollapsed || isRecentChatsLoading;
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const isGuest = isAuthReady && !isAuthenticated && !isAuthLoading;

  const { isPinnedChat, pinnedChats, unpinnedRecentChats, visibleRecentChats } =
    buildSidebarChatItems({
      activeSessionId,
      chatSessions,
      currentChatTitle,
      pendingSessionId,
      pinnedSessionIds,
      sessionTitles,
    });
  const menuChat = chatMenu
    ? (visibleRecentChats.find((chat) => chat.key === chatMenu.chatKey) ?? null)
    : null;
  const isMenuChatPinned = menuChat ? isPinnedChat(menuChat) : false;
  /** 아직 저장되지 않은 새 대화는 고정·삭제할 대상이 없다. */
  const canManageMenuChat = menuChat?.sessionId != null;
  const selectChat = (chat: SidebarChatItem) => {
    if (chat.sessionId !== null) {
      onSelectChat?.(chat.sessionId);
    }
  };

  const handlePinChat = (chat: SidebarChatItem) => {
    closeChatMenu();

    // 아직 저장되지 않은 새 대화는 고정할 대상이 없다.
    if (chat.sessionId === null) return;

    onTogglePinChat?.(chat.sessionId);
  };

  const handleRequestDeleteChat = (chat: SidebarChatItem) => {
    closeChatMenu();

    if (chat.sessionId === null) return;

    onHideTooltip();
    setDeleteTargetChat(chat);
  };

  const handleConfirmDeleteChat = () => {
    if (deleteTargetChat?.sessionId != null) {
      onDeleteChat?.(deleteTargetChat.sessionId);
    }

    setDeleteTargetChat(null);
  };

  usePointerDownOutside({
    enabled: Boolean(chatMenu),
    ignoredSelector: "[data-chat-menu-trigger='true']",
    onPointerDownOutside: closeChatMenu,
    ref: chatMenuRef,
  });

  return (
    <aside
      className={cn(
        sidebarClassName,
        isOpen ? "w-[296px]" : "w-0 border-r-0 md:w-[64px] md:border-r",
      )}
    >
      <div className="flex h-full w-[296px] shrink-0 flex-col">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 w-[92px] shrink-0 items-center pl-5 md:hidden">
            <Logo
              href=""
              onClick={onOpenHome}
              priority
              heightClassName="h-9"
              alt="VITA"
            />
          </div>

          <div
            className="group relative hidden shrink-0 justify-center md:flex md:w-[64px]"
            onMouseEnter={onShowRailTooltip(isOpen ? "홈" : "사이드바 열기")}
            onMouseLeave={onHideTooltip}
          >
            {isOpen ? (
              <button
                type="button"
                onClick={onOpenHome}
                className="relative flex h-10 w-auto items-center rounded-xl transition"
                aria-label="홈으로 이동"
              >
                <span className="translate-x-3 text-xl font-extrabold tracking-normal text-gray-950 dark:text-white">
                  VITA
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="focus-visible:ring-brand/40 relative flex h-10 w-10 cursor-ew-resize items-center justify-center rounded-xl transition outline-none hover:bg-white focus-visible:ring-2 dark:hover:bg-white/10"
                aria-label="사이드바 열기"
              >
                <Logo
                  href=""
                  priority
                  heightClassName="h-8 transition group-hover:opacity-0"
                  alt="VITA"
                />

                <PanelLeftOpen
                  size={21}
                  className="pointer-events-none absolute hidden text-gray-700 opacity-0 transition group-hover:opacity-100 md:block dark:text-gray-200"
                />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex items-center gap-1 pr-5",
              isOpen
                ? "pointer-events-auto opacity-100 transition-opacity delay-150 duration-150"
                : "pointer-events-none opacity-0",
            )}
          >
            <div
              className="group relative"
              onMouseEnter={onShowHeaderTooltip("검색")}
              onMouseLeave={onHideTooltip}
            >
              <button
                type="button"
                onClick={onOpenSearch}
                className={sidebarIconButtonClassName}
                aria-label="상담 검색"
              >
                <Search size={19} />
              </button>
            </div>

            <div
              className="group relative"
              onMouseEnter={onShowHeaderTooltip("사이드바 닫기")}
              onMouseLeave={onHideTooltip}
            >
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  sidebarIconButtonClassName,
                  "md:cursor-ew-resize",
                )}
                aria-label="사이드바 닫기"
              >
                <X size={20} className="md:hidden" />
                <PanelLeftClose size={19} className="hidden md:block" />
              </button>
            </div>
          </div>
        </div>

        {chatMenu && menuChat && (
          <ChatSessionMenu
            canManage={canManageMenuChat}
            chat={menuChat}
            isPinned={isMenuChatPinned}
            left={chatMenu.left}
            menuRef={chatMenuRef}
            onDelete={handleRequestDeleteChat}
            onTogglePin={handlePinChat}
            top={chatMenu.top}
          />
        )}

        <div
          className={cn(
            "flex flex-1 flex-col pt-4 pb-5",
            isOpen ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden",
          )}
        >
          <ChatSidebarNav
            activeMode={activeMode}
            activeSessionId={activeSessionId}
            currentChatTitle={currentChatTitle}
            isGuest={isGuest}
            isOpen={isOpen}
            onHideTooltip={onHideTooltip}
            onNewChat={onNewChat}
            onOpenSearch={onOpenSearch}
            onShowRailTooltip={onShowRailTooltip}
            pendingSessionId={pendingSessionId}
          />

          {isAuthenticated && (
            <div
              className={cn(
                "mt-8",
                isOpen
                  ? "pointer-events-auto opacity-100 transition-opacity delay-150 duration-150"
                  : "pointer-events-none opacity-0",
              )}
            >
              <ChatSessionList
                isCollapsed={isRecentChatsCollapsed}
                isLoading={isRecentChatsLoading}
                isRecentChatsHidden={isRecentChatsHidden}
                onOpenMenu={openChatMenu}
                onSelectChat={selectChat}
                onToggleCollapsed={() => {
                  if (isRecentChatsLoading) return;
                  setIsRecentChatsCollapsed((isCollapsed) => !isCollapsed);
                }}
                onTogglePin={handlePinChat}
                pinnedChats={pinnedChats}
                unpinnedRecentChats={unpinnedRecentChats}
              />
            </div>
          )}
        </div>

        {deleteTargetChat && (
          <ChatDeleteConfirmDialog
            title={deleteTargetChat.title}
            onCancel={() => setDeleteTargetChat(null)}
            onConfirm={handleConfirmDeleteChat}
          />
        )}

        <ChatSidebarFooter
          isAuthReady={isAuthReady}
          isAuthenticated={isAuthenticated}
          isGuest={isGuest}
          isOpen={isOpen}
          onHideTooltip={onHideTooltip}
          onOpenLogin={onOpenLogin}
          onOpenProfile={onOpenProfile}
          onShowRailTooltip={onShowRailTooltip}
          onStartTour={onStartTour}
        />
      </div>
    </aside>
  );
};

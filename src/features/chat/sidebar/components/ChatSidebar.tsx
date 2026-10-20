"use client";

import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { ChatCurrentSession } from "@/features/chat/sidebar/components/ChatCurrentSession";
import { ChatDeleteConfirmDialog } from "@/features/chat/sidebar/components/ChatDeleteConfirmDialog";
import { ChatSessionList } from "@/features/chat/sidebar/components/ChatSessionList";
import { ChatSessionMenu } from "@/features/chat/sidebar/components/ChatSessionMenu";
import { ChatSidebarFooter } from "@/features/chat/sidebar/components/ChatSidebarFooter";
import { ChatSidebarNav } from "@/features/chat/sidebar/components/ChatSidebarNav";
import { useFloatingChatMenu } from "@/features/chat/sidebar/hooks/useFloatingChatMenu";
import { usePointerDownOutside } from "@/shared/hooks/usePointerDownOutside";
import {
  buildSidebarChatItems,
  type SidebarChatItem,
} from "@/features/chat/sidebar/lib/chatSidebarItems";
import {
  chatSidebarClassName,
  chatSidebarIconButtonClassName,
} from "@/features/chat/sidebar/lib/chatSidebarStyles";
import type { ChatMode, ChatSessionSummary } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/atoms/Logo";

type ChatSidebarProps = {
  isAuthenticated: boolean;
  isAuthExpired?: boolean;
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
  onOpenSettings: () => void;
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
  pendingSessionId?: number | null;
  activeSessionId?: number | null;
  sessionTitles?: Readonly<Record<number, string>>;
  isRecentChatsLoading?: boolean;
  onSelectChat?: (sessionId: number) => void;
  onOpenCurrentChat?: () => void;
  isCurrentChatAnswering?: boolean;
  pinnedSessionIds?: readonly number[];
  onTogglePinChat?: (sessionId: number) => void | Promise<void>;
  onRenameChat?: (sessionId: number, title: string) => Promise<boolean>;
  onDeleteChat?: (sessionId: number) => void | Promise<void>;
};

export const ChatSidebar = ({
  activeMode,
  activeSessionId = null,
  chatSessions = [],
  currentChatTitle,
  isAuthLoading,
  isAuthReady,
  isAuthenticated,
  isAuthExpired = false,
  isOpen,
  onClose,
  onNewChat,
  onHideTooltip,
  onOpen,
  onOpenHome,
  onOpenLogin,
  onOpenProfile,
  onOpenSearch,
  onOpenSettings,
  onDeleteChat,
  onRenameChat,
  onSelectChat,
  onOpenCurrentChat,
  isCurrentChatAnswering = false,
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
  const isRecentChatsHidden = isRecentChatsCollapsed || isRecentChatsLoading;
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const isGuest = isAuthReady && !isAuthenticated && !isAuthLoading;

  const {
    currentChat,
    isPinnedChat,
    pinnedChats,
    unpinnedRecentChats,
    visibleRecentChats,
  } = buildSidebarChatItems({
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

    void onTogglePinChat?.(chat.sessionId);
  };

  const handleRequestDeleteChat = (chat: SidebarChatItem) => {
    closeChatMenu();

    if (chat.sessionId === null) return;

    onHideTooltip();
    setDeleteTargetChat(chat);
  };

  const handleRenameChat = (chat: SidebarChatItem, title: string) =>
    chat.sessionId === null || !onRenameChat
      ? Promise.resolve(false)
      : onRenameChat(chat.sessionId, title);

  const handleConfirmDeleteChat = () => {
    const targetSessionId = deleteTargetChat?.sessionId;

    setDeleteTargetChat(null);

    if (targetSessionId != null) {
      void onDeleteChat?.(targetSessionId);
    }
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
        chatSidebarClassName,
        // 모바일은 접힌 레일(64px)을 띄우지 않고 서랍처럼 화면 밖으로 완전히 숨긴다(좌측 상단 버튼으로 연다).
        isOpen ? "w-[296px]" : "w-[296px] max-md:-translate-x-full md:w-[64px]",
      )}
    >
      <div className="flex h-full w-[296px] shrink-0 flex-col">
        <div className="flex h-16 items-center justify-between">
          <div
            className={cn(
              "h-10 w-[92px] shrink-0 items-center pl-5 md:hidden",
              isOpen ? "flex" : "hidden",
            )}
          >
            <Logo
              href=""
              onClick={onOpenHome}
              priority
              heightClassName="h-9"
              alt="VITA"
            />
          </div>

          <div
            className={cn(
              "group relative shrink-0 justify-center",
              isOpen ? "hidden md:flex md:w-[64px]" : "flex w-[64px]",
            )}
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
                className={chatSidebarIconButtonClassName}
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
                  chatSidebarIconButtonClassName,
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
            onRename={handleRenameChat}
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
            onOpenSidebar={onOpen}
            onOpenSearch={onOpenSearch}
            onShowRailTooltip={onShowRailTooltip}
            pendingSessionId={pendingSessionId}
          />

          {currentChat && (
            <ChatCurrentSession
              chat={currentChat}
              isActive={activeMode === "chat" && currentChat.active}
              isAnswering={isCurrentChatAnswering}
              isGuest={isGuest}
              isOpen={isOpen}
              isPinned={isPinnedChat(currentChat)}
              onHideTooltip={onHideTooltip}
              onOpen={() => onOpenCurrentChat?.()}
              onOpenMenu={openChatMenu}
              onShowRailTooltip={onShowRailTooltip}
              onTogglePin={handlePinChat}
            />
          )}

          {isAuthExpired && isOpen && (
            <div className="mx-4 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-bold">로그인이 만료되었어요.</p>
              <p className="mt-1 text-xs leading-5 opacity-80">
                저장된 상담을 계속 보려면
                <br />
                다시 로그인해 주세요.
              </p>
              <button
                type="button"
                onClick={onOpenLogin}
                className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-amber-200/70 text-xs font-extrabold text-amber-950 transition hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-50 dark:hover:bg-amber-900"
              >
                다시 로그인
              </button>
            </div>
          )}

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
          onOpenSettings={onOpenSettings}
          onShowRailTooltip={onShowRailTooltip}
          onStartTour={onStartTour}
        />
      </div>
    </aside>
  );
};

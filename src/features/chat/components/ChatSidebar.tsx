"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  MessageCircle,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Settings,
  Sun,
  Search,
  X,
} from "lucide-react";
import { ChatDeleteConfirmDialog } from "@/features/chat/components/ChatDeleteConfirmDialog";
import { ChatSessionMenu } from "@/features/chat/components/ChatSessionMenu";
import { serviceMenus } from "@/features/chat/constants";
import {
  buildSidebarChatItems,
  type SidebarChatItem,
} from "@/features/chat/lib/chatSidebarItems";
import type { ChatMode, ChatSessionSummary } from "@/features/chat/types";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { showToast } from "@/shared/ui/ToastProvider";
import { LogoutConfirmDialog } from "@/shared/ui/LogoutConfirmDialog";
import { useTheme } from "@/shared/ui/ThemeProvider";
import { UserAvatar } from "@/shared/ui/UserAvatar";

type ChatSidebarProps = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthReady: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNewChat: () => void;
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

/** 최근 상담을 펼칠 때 항목이 위에서부터 차례로 나타나도록 주는 지연 간격. */
const RECENT_CHAT_STAGGER_MS = 40;
/** 목록이 길어도 마지막 항목이 너무 늦게 나타나지 않도록 지연을 이 순번까지만 늘린다. */
const RECENT_CHAT_STAGGER_LIMIT = 8;

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
  const { logout, user } = useAuthUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [chatMenu, setChatMenu] = useState<{
    left: number;
    chatKey: string;
    top: number;
  } | null>(null);
  const [deleteTargetChat, setDeleteTargetChat] =
    useState<SidebarChatItem | null>(null);
  const [isRecentChatsCollapsed, setIsRecentChatsCollapsed] = useState(false);
  // 사용자가 직접 접었는지(isRecentChatsCollapsed)와 불러오는 중인지를 합쳐 실제로 접어 보일지 정한다.
  const isRecentChatsHidden = isRecentChatsCollapsed || isRecentChatsLoading;
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "사용자";
  const isDarkMode = resolvedTheme === "dark";
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

  const handleAccountMenuToggle = () => {
    onHideTooltip();
    setIsAccountMenuOpen((current) => !current);
  };

  const handleOpenProfile = () => {
    setIsAccountMenuOpen(false);
    onOpenProfile();
  };

  const handleLogout = async () => {
    await logout();
    setIsAccountMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    showToast("로그아웃되었습니다.");
  };

  const handlePinChat = (chat: SidebarChatItem) => {
    setChatMenu(null);

    // 아직 저장되지 않은 새 대화는 고정할 대상이 없다.
    if (chat.sessionId === null) return;

    onTogglePinChat?.(chat.sessionId);
  };

  const handleRequestDeleteChat = (chat: SidebarChatItem) => {
    setChatMenu(null);

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

  const handleOpenChatMenu = (
    event: MouseEvent<HTMLButtonElement>,
    chatKey: string,
  ) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 348;
    const menuWidth = 260;
    const gap = 8;
    const viewportPadding = 12;
    const sidebarMenuLeft = 244;
    const canOpenDown =
      rect.bottom + gap + menuHeight <= window.innerHeight - viewportPadding;
    const top = canOpenDown
      ? rect.bottom + gap
      : Math.max(viewportPadding, rect.top - menuHeight - gap);
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, sidebarMenuLeft),
    );

    setChatMenu((currentMenu) =>
      currentMenu?.chatKey === chatKey
        ? null
        : {
            left,
            chatKey,
            top,
          },
    );
  };

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!chatMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest("[data-chat-menu-trigger='true']")) {
        return;
      }

      if (chatMenuRef.current && !chatMenuRef.current.contains(target)) {
        setChatMenu(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [chatMenu]);

  return (
    <aside
      className={cn(
        "bg-surface-muted fixed inset-y-0 left-0 z-[100] flex overflow-hidden border-r border-gray-200 text-gray-950 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:text-white",
        isOpen ? "w-[296px]" : "w-0 border-r-0 md:w-[64px] md:border-r",
      )}
    >
      <div className="flex h-full w-[296px] shrink-0 flex-col">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 w-[92px] shrink-0 items-center pl-5 md:hidden">
            <Logo
              href={routes.home}
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
              <Link
                href={routes.home}
                className="relative flex h-10 w-auto items-center rounded-xl transition"
                aria-label="홈으로 이동"
              >
                <span className="translate-x-3 text-xl font-extrabold tracking-normal text-gray-950 dark:text-white">
                  VITA
                </span>
              </Link>
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
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
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
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white hover:text-gray-950 md:cursor-ew-resize dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
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
          <nav className="space-y-1">
            {serviceMenus.map((menu) => {
              const Icon = menu.icon;
              // "새 상담"은 아직 아무 상담도 열지 않은 빈 화면일 때만 선택 표시한다.
              // (지난 상담을 보고 있는데 새 상담이 같이 강조돼 화면이 바뀐 것처럼 보이던 문제)
              const isNewChatEmpty =
                activeSessionId == null &&
                !currentChatTitle &&
                pendingSessionId == null;
              const isActive =
                menu.mode === activeMode &&
                (menu.label !== "새 상담" || (!isGuest && isNewChatEmpty));
              const shortcut =
                menu.label === "새 상담"
                  ? "Ctrl+Shift+O"
                  : menu.label === "검색"
                    ? "Ctrl+K"
                    : undefined;
              const itemClassName = cn(
                "group relative flex h-11 w-[296px] items-center pr-3 text-sm font-bold transition-colors duration-150",
                isActive
                  ? "text-brand"
                  : menu.disabled
                    ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                    : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
              );

              const itemContent = (
                <>
                  {isOpen && (
                    <span
                      id={
                        menu.label === "매장 지도"
                          ? "vita-store-map-tour"
                          : undefined
                      }
                      className={cn(
                        "absolute inset-y-0 right-2 left-2 rounded-xl transition-colors",
                        isActive
                          ? "bg-white dark:bg-white/10"
                          : menu.disabled
                            ? ""
                            : "group-hover:bg-gray-300/70 dark:group-hover:bg-white/10",
                      )}
                    />
                  )}

                  <span className="relative z-10 flex h-11 w-[64px] shrink-0 items-center justify-center">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition",
                        !isOpen && isActive
                          ? "bg-white text-gray-950 dark:bg-white/10 dark:text-white"
                          : !isOpen
                            ? menu.disabled
                              ? ""
                              : "group-hover:bg-gray-300/70 group-hover:text-gray-950 dark:group-hover:bg-white/10 dark:group-hover:text-white"
                            : "",
                      )}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                  </span>

                  {isOpen && (
                    <span className="relative z-10 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150">
                      {menu.label}
                    </span>
                  )}
                </>
              );

              return menu.href ? (
                menu.label === "새 상담" ? (
                  <button
                    key={menu.label}
                    type="button"
                    className={itemClassName}
                    onClick={onNewChat}
                    onMouseEnter={onShowRailTooltip(menu.label, shortcut)}
                    onMouseLeave={onHideTooltip}
                  >
                    {itemContent}
                  </button>
                ) : (
                  <Link
                    key={menu.label}
                    href={menu.href}
                    className={itemClassName}
                    onMouseEnter={onShowRailTooltip(menu.label, shortcut)}
                    onMouseLeave={onHideTooltip}
                  >
                    {itemContent}
                  </Link>
                )
              ) : (
                <button
                  key={menu.label}
                  type="button"
                  disabled={menu.disabled}
                  onClick={menu.label === "검색" ? onOpenSearch : undefined}
                  className={itemClassName}
                  aria-label={
                    menu.disabled ? `${menu.label} 준비 중` : menu.label
                  }
                  onMouseEnter={onShowRailTooltip(menu.label, shortcut)}
                  onMouseLeave={onHideTooltip}
                >
                  {itemContent}
                </button>
              );
            })}

            {!isOpen && (
              <button
                type="button"
                className="group relative flex h-11 w-[296px] items-center pr-3 text-sm font-bold text-gray-500 transition-colors duration-150 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                aria-label="최근 상담"
                onMouseEnter={onShowRailTooltip("최근 상담")}
                onMouseLeave={onHideTooltip}
              >
                <span className="relative z-10 flex h-11 w-[64px] shrink-0 items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:bg-gray-300/70 group-hover:text-gray-950 dark:group-hover:bg-white/10 dark:group-hover:text-white">
                    <MessageCircle size={20} strokeWidth={1.8} />
                  </span>
                </span>
              </button>
            )}
          </nav>

          {isAuthenticated && (
            <div
              className={cn(
                "mt-8",
                isOpen
                  ? "pointer-events-auto opacity-100 transition-opacity delay-150 duration-150"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="space-y-1">
                {pinnedChats.length > 0 && (
                  <>
                    <p className="mb-2 px-3 text-xs font-bold text-gray-400">
                      고정됨
                    </p>

                    {pinnedChats.map((chat) => (
                      <div
                        key={chat.key}
                        className={cn(
                          "group relative mx-1 flex h-11 w-[calc(100%-0.5rem)] items-center rounded-xl text-left transition-colors duration-150",
                          chat.active
                            ? "bg-white dark:bg-white/10"
                            : "hover:bg-gray-300/70 dark:hover:bg-white/10",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => selectChat(chat)}
                          aria-current={chat.active ? "true" : undefined}
                          className={cn(
                            "focus-visible:ring-brand/30 min-w-0 flex-1 truncate px-5 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            chat.active
                              ? "text-brand"
                              : "text-gray-500 group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-white",
                          )}
                        >
                          {chat.title}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePinChat(chat)}
                          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label="채팅 고정 해제"
                        >
                          <PinOff size={16} />
                        </button>

                        <button
                          type="button"
                          data-chat-menu-trigger="true"
                          onClick={(event) =>
                            handleOpenChatMenu(event, chat.key)
                          }
                          className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label="채팅 메뉴"
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isRecentChatsLoading) return;
                    setIsRecentChatsCollapsed((isCollapsed) => !isCollapsed);
                  }}
                  aria-expanded={!isRecentChatsHidden}
                  aria-busy={isRecentChatsLoading || undefined}
                  aria-controls="chat-sidebar-recent-list"
                  className="group/recent focus-visible:ring-brand/30 mx-1 mt-4 mb-2 flex h-7 w-[calc(100%-0.5rem)] items-center gap-1 rounded-lg px-2 text-left text-xs font-bold text-gray-400 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:outline-none dark:hover:text-gray-200"
                >
                  최근 상담
                  <ChevronDown
                    size={14}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    className={cn(
                      "transition-transform duration-200",
                      isRecentChatsHidden && "-rotate-90",
                    )}
                  />
                  {isRecentChatsCollapsed &&
                    !isRecentChatsLoading &&
                    unpinnedRecentChats.length > 0 && (
                      <span className="ml-auto font-semibold text-gray-400/80">
                        {unpinnedRecentChats.length}
                      </span>
                    )}
                </button>

                <div
                  id="chat-sidebar-recent-list"
                  aria-hidden={isRecentChatsHidden}
                  inert={isRecentChatsHidden}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isRecentChatsHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div
                      className={cn(
                        "space-y-1 transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isRecentChatsHidden
                          ? "-translate-y-3 opacity-0"
                          : "translate-y-0 opacity-100",
                      )}
                    >
                      {unpinnedRecentChats.length === 0 && (
                        <p className="px-5 py-2 text-xs font-medium text-gray-400">
                          아직 상담 내역이 없어요.
                        </p>
                      )}

                      {unpinnedRecentChats.map((chat, index) => (
                        <div
                          key={chat.key}
                          style={
                            {
                              // hover 배경색 전환에는 지연이 붙지 않도록, 나타나는 모션에만 쓰는 변수로 넘긴다.
                              "--recent-chat-delay": isRecentChatsHidden
                                ? "0ms"
                                : `${Math.min(index, RECENT_CHAT_STAGGER_LIMIT) * RECENT_CHAT_STAGGER_MS}ms`,
                            } as CSSProperties
                          }
                          className={cn(
                            "group relative mx-1 flex h-11 w-[calc(100%-0.5rem)] items-center rounded-xl text-left [transition:background-color_150ms,opacity_450ms_cubic-bezier(0.22,1,0.36,1)_var(--recent-chat-delay),translate_450ms_cubic-bezier(0.22,1,0.36,1)_var(--recent-chat-delay)]",
                            isRecentChatsHidden
                              ? "-translate-y-2 opacity-0"
                              : "translate-y-0 opacity-100",
                            chat.active
                              ? "bg-white dark:bg-white/10"
                              : "hover:bg-gray-300/70 dark:hover:bg-white/10",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectChat(chat)}
                            aria-current={chat.active ? "true" : undefined}
                            className={cn(
                              "focus-visible:ring-brand/30 min-w-0 flex-1 truncate px-5 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                              chat.active
                                ? "text-brand"
                                : "text-gray-500 group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-white",
                            )}
                          >
                            {chat.title}
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePinChat(chat)}
                            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="채팅 고정"
                          >
                            <Pin size={16} />
                          </button>

                          <button
                            type="button"
                            data-chat-menu-trigger="true"
                            onClick={(event) =>
                              handleOpenChatMenu(event, chat.key)
                            }
                            className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label="채팅 메뉴"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "relative mt-auto py-3",
            isOpen ? "border-t border-gray-200/80 dark:border-white/10" : "",
          )}
          ref={accountMenuRef}
        >
          {isAccountMenuOpen && (
            <div className="fixed bottom-[64px] left-2 z-[120] w-[280px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900">
              <button
                type="button"
                onClick={handleOpenProfile}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <UserAvatar size="xs" />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-gray-950 dark:text-white">
                    {displayName}
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  className="text-gray-400 dark:text-gray-500"
                />
              </button>

              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <MessageCircle size={18} />
                개인 맞춤 설정
              </button>

              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Settings size={18} />
                설정
              </button>

              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  onStartTour();
                }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <CircleHelp size={18} />
                도움말
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          )}

          {deleteTargetChat && (
            <ChatDeleteConfirmDialog
              title={deleteTargetChat.title}
              onCancel={() => setDeleteTargetChat(null)}
              onConfirm={handleConfirmDeleteChat}
            />
          )}

          {isLogoutConfirmOpen && (
            <LogoutConfirmDialog
              onCancel={() => setIsLogoutConfirmOpen(false)}
              onConfirm={handleLogout}
            />
          )}

          {!isAuthReady ? (
            <div
              className={cn("h-12 shrink-0", isOpen ? "w-[296px]" : "w-[64px]")}
            />
          ) : isGuest && isOpen ? (
            <div className="space-y-3 px-3">
              <div className="space-y-1 border-b border-gray-200/80 pb-3 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-bold text-gray-600 transition hover:bg-gray-300/70 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
                  {isDarkMode ? "라이트 모드" : "다크 모드"}
                </button>

                <button
                  type="button"
                  onClick={onStartTour}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-bold text-gray-600 transition hover:bg-gray-300/70 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <CircleHelp size={19} />
                  도움말
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-sm font-extrabold text-gray-950 dark:text-white">
                    내게 맞춘 답변을 받아보세요
                  </p>
                  <p className="mt-2 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
                    로그인하면 상담 기록을 저장하고 더 정확한 통신 안내를 받을
                    수 있어요.
                  </p>
                </div>

                <Link
                  href={routes.login}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-950 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  로그인
                </Link>
              </div>
            </div>
          ) : isGuest ? (
            <div className="flex h-12 w-[64px] items-center justify-center">
              <ThemeToggleButton
                className="h-9 w-9"
                iconSize={18}
                onMouseEnter={onShowRailTooltip(
                  isDarkMode ? "라이트 모드" : "다크 모드",
                )}
                onMouseLeave={onHideTooltip}
              />
            </div>
          ) : isAuthenticated && isOpen ? (
            <div className="group relative flex h-12 w-[296px] items-center pr-3 text-left transition-colors">
              <span className="absolute inset-y-0 right-2 left-2 rounded-xl transition group-hover:bg-gray-300/70 dark:group-hover:bg-white/10" />

              <button
                type="button"
                className="relative z-10 flex h-12 min-w-0 flex-1 items-center text-left"
                aria-label="프로필"
                aria-expanded={isAccountMenuOpen}
                onClick={handleAccountMenuToggle}
                onMouseEnter={onShowRailTooltip(displayName)}
                onMouseLeave={onHideTooltip}
              >
                <span className="flex h-12 w-[64px] shrink-0 items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl">
                    <UserAvatar size="sm" />
                  </span>
                </span>

                <span className="min-w-0 opacity-100 transition-opacity delay-150 duration-150">
                  <span className="block truncate text-sm font-bold text-gray-950 dark:text-white">
                    {displayName}
                  </span>
                </span>
              </button>

              <ThemeToggleButton className="relative z-10 ml-auto shrink-0" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex h-12 w-[64px] items-center justify-center">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-300/70 dark:hover:bg-white/10"
                aria-label="프로필"
                aria-expanded={isAccountMenuOpen}
                onClick={handleAccountMenuToggle}
                onMouseEnter={onShowRailTooltip(displayName)}
                onMouseLeave={onHideTooltip}
              >
                <UserAvatar size="sm" />
              </button>
            </div>
          ) : (
            <div
              className={cn("h-12 shrink-0", isOpen ? "w-[296px]" : "w-[64px]")}
            />
          )}
        </div>
      </div>
    </aside>
  );
};

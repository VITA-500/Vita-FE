"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ChevronRight,
  Folder,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  PinOff,
  Settings,
  Share2,
  Sparkles,
  Search,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import { recentChats, serviceMenus } from "@/features/chat/constants";
import type { ChatMode } from "@/features/chat/types";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { showToast } from "@/shared/ui/ToastProvider";

type ChatSidebarProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenSearch: () => void;
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
};

export const ChatSidebar = ({
  activeMode,
  currentChatTitle,
  isOpen,
  onClose,
  onHideTooltip,
  onOpen,
  onOpenSearch,
  onShowHeaderTooltip,
  onShowRailTooltip,
}: ChatSidebarProps) => {
  const router = useRouter();
  const { logout, user } = useAuthUser();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [chatMenu, setChatMenu] = useState<{
    left: number;
    title: string;
    top: number;
  } | null>(null);
  const [pinnedChatTitles, setPinnedChatTitles] = useState<string[]>([]);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "사용자";

  const visibleRecentChats = currentChatTitle
    ? [
        { title: currentChatTitle, active: true },
        ...recentChats
          .filter((chat) => chat.title !== currentChatTitle)
          .map((chat) => ({ ...chat, active: false })),
      ]
    : recentChats;
  const pinnedChats = pinnedChatTitles
    .map((title) => visibleRecentChats.find((chat) => chat.title === title))
    .filter((chat): chat is (typeof visibleRecentChats)[number] =>
      Boolean(chat),
    );
  const unpinnedRecentChats = visibleRecentChats.filter(
    (chat) => !pinnedChatTitles.includes(chat.title),
  );

  const handleAccountMenuToggle = () => {
    onHideTooltip();
    setIsAccountMenuOpen((current) => !current);
  };

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    showToast("로그아웃되었습니다.");
    router.replace(routes.home);
  };

  const handlePinChat = (title: string) => {
    setPinnedChatTitles((currentTitles) =>
      currentTitles.includes(title)
        ? currentTitles.filter((currentTitle) => currentTitle !== title)
        : [...currentTitles, title],
    );
    setChatMenu(null);
  };

  const handleOpenChatMenu = (
    event: MouseEvent<HTMLButtonElement>,
    title: string,
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
      currentMenu?.title === title
        ? null
        : {
            left,
            title,
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
        isOpen ? "w-[276px]" : "w-0 border-r-0 md:w-[64px] md:border-r",
      )}
    >
      <div className="flex h-full w-[276px] shrink-0 flex-col">
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

        {chatMenu && (
          <div
            ref={chatMenuRef}
            className="fixed z-[130] w-[260px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
            style={{ left: chatMenu.left, top: chatMenu.top }}
          >
            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Share2 size={18} />
              공유하기
            </button>

            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Pencil size={18} />
              이름 바꾸기
            </button>

            <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

            <button
              type="button"
              onClick={() => handlePinChat(chatMenu.title)}
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {pinnedChatTitles.includes(chatMenu.title) ? (
                <PinOff size={18} />
              ) : (
                <Pin size={18} />
              )}
              {pinnedChatTitles.includes(chatMenu.title)
                ? "채팅 고정 해제"
                : "채팅 고정"}
            </button>

            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Archive size={18} />
              아카이브에 보관
            </button>

            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 size={18} />
              삭제
            </button>

            <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Folder size={18} />
              프로젝트로 이동
              <ChevronRight size={17} className="ml-auto text-gray-400" />
            </button>
          </div>
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
              const isActive = menu.mode === activeMode;
              const shortcut =
                menu.label === "새 상담"
                  ? "Ctrl+Shift+O"
                  : menu.label === "검색"
                    ? "Ctrl+K"
                    : undefined;
              const itemClassName = cn(
                "group relative flex h-11 w-[276px] items-center pr-3 text-sm font-bold transition-colors duration-150",
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
                <Link
                  key={menu.label}
                  href={menu.href}
                  className={itemClassName}
                  onMouseEnter={onShowRailTooltip(menu.label, shortcut)}
                  onMouseLeave={onHideTooltip}
                >
                  {itemContent}
                </Link>
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
                className="group relative flex h-11 w-[276px] items-center pr-3 text-sm font-bold text-gray-500 transition-colors duration-150 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
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
                      key={chat.title}
                      className="group relative mx-1 flex h-11 w-[calc(100%-0.5rem)] items-center rounded-xl text-left transition-colors duration-150 hover:bg-gray-300/70 dark:hover:bg-white/10"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate px-5 text-left text-sm font-semibold text-gray-500 transition-colors group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-white"
                      >
                        {chat.title}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePinChat(chat.title)}
                        className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label="채팅 고정 해제"
                      >
                        <PinOff size={16} />
                      </button>

                      <button
                        type="button"
                        data-chat-menu-trigger="true"
                        onClick={(event) =>
                          handleOpenChatMenu(event, chat.title)
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

              <p className="mb-2 px-3 pt-4 text-xs font-bold text-gray-400">
                최근 상담
              </p>

              {unpinnedRecentChats.map((chat) => (
                <div
                  key={chat.title}
                  className={cn(
                    "group relative mx-1 flex h-11 w-[calc(100%-0.5rem)] items-center rounded-xl text-left transition-colors duration-150",
                    chat.active
                      ? "bg-white dark:bg-white/10"
                      : "hover:bg-gray-300/70 dark:hover:bg-white/10",
                  )}
                >
                  <button
                    type="button"
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
                    onClick={() => handlePinChat(chat.title)}
                    className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="채팅 고정"
                  >
                    <Pin size={16} />
                  </button>

                  <button
                    type="button"
                    data-chat-menu-trigger="true"
                    onClick={(event) => handleOpenChatMenu(event, chat.title)}
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

        <div
          className={cn(
            "relative mt-auto py-3",
            isOpen ? "border-t border-gray-200/80 dark:border-white/10" : "",
          )}
          ref={accountMenuRef}
        >
          {isAccountMenuOpen && (
            <div className="fixed bottom-[64px] left-3 z-[120] w-[312px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"
              >
                <span className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white">
                  V
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-gray-950 dark:text-white">
                    {displayName}
                  </span>
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Plus
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
                <Sparkles size={18} />
                요금제 업그레이드
              </button>

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
                <UserCircle size={18} />
                프로필
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
                onClick={handleLogout}
                className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          )}

          {isOpen ? (
            <div className="group relative flex h-12 w-[276px] items-center pr-3 text-left transition-colors">
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
                    <span className="bg-brand flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-white">
                      V
                    </span>
                  </span>
                </span>

                <span className="min-w-0 opacity-100 transition-opacity delay-150 duration-150">
                  <span className="block truncate text-sm font-bold text-gray-950 dark:text-white">
                    {displayName}
                  </span>

                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    VITA 회원
                  </span>
                </span>
              </button>

              <ThemeToggleButton className="relative z-10 ml-auto shrink-0" />
            </div>
          ) : (
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
                <span className="bg-brand flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-white">
                  V
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

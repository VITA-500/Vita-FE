"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { MessageCircle } from "lucide-react";
import { serviceMenus } from "@/features/chat/constants";
import type { ChatMode } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

type ChatSidebarNavProps = {
  activeMode: ChatMode;
  activeSessionId?: number | null;
  currentChatTitle?: string;
  isGuest: boolean;
  isOpen: boolean;
  onHideTooltip: () => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onShowRailTooltip: (
    label: string,
    shortcut?: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  pendingSessionId?: number | null;
};

const getMenuShortcut = (label: string) =>
  label === "새 상담"
    ? "Ctrl+Shift+O"
    : label === "검색"
      ? "Ctrl+K"
      : undefined;

export const ChatSidebarNav = ({
  activeMode,
  activeSessionId = null,
  currentChatTitle,
  isGuest,
  isOpen,
  onHideTooltip,
  onNewChat,
  onOpenSearch,
  onShowRailTooltip,
  pendingSessionId = null,
}: ChatSidebarNavProps) => (
  <nav className="space-y-1">
    {serviceMenus.map((menu) => {
      const Icon = menu.icon;
      // "새 상담"은 아직 아무 상담도 열지 않은 빈 화면일 때만 선택 표시한다.
      // 지난 상담을 보는 중에 새 상담도 같이 강조되면 화면 상태가 헷갈린다.
      const isNewChatEmpty =
        activeSessionId == null &&
        !currentChatTitle &&
        pendingSessionId == null;
      const isActive =
        menu.mode === activeMode &&
        (menu.label !== "새 상담" || (!isGuest && isNewChatEmpty));
      const shortcut = getMenuShortcut(menu.label);
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
                menu.label === "매장 지도" ? "vita-store-map-tour" : undefined
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
          aria-label={menu.disabled ? `${menu.label} 준비 중` : menu.label}
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
);

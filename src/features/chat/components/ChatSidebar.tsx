"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import {
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { recentChats, serviceMenus } from "@/features/chat/constants";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";

type ChatSidebarProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onShowRailTooltip: (
    label: string,
    shortcut?: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onShowHeaderTooltip: (
    label: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onHideTooltip: () => void;
};

export const ChatSidebar = ({
  isOpen,
  onClose,
  onHideTooltip,
  onOpen,
  onShowHeaderTooltip,
  onShowRailTooltip,
}: ChatSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[100] flex overflow-hidden border-r border-gray-200 bg-surface-muted text-gray-950 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:text-white",
        isOpen ? "w-[300px] md:w-[276px]" : "w-0 border-r-0 md:w-[64px] md:border-r",
      )}
    >
    <div className="flex h-full w-[300px] shrink-0 flex-col md:w-[276px]">
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
              className="relative flex h-10 w-10 cursor-ew-resize items-center justify-center rounded-xl outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-brand/40 dark:hover:bg-white/10"
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
                className="pointer-events-none absolute hidden text-gray-700 opacity-0 transition group-hover:opacity-100 dark:text-gray-200 md:block"
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
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white md:cursor-ew-resize"
              aria-label="사이드바 닫기"
            >
              <X size={20} className="md:hidden" />
              <PanelLeftClose size={19} className="hidden md:block" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col pb-5 pt-4",
          isOpen ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
        )}
      >
        <nav className="space-y-1">
          {serviceMenus.map((menu) => {
            const Icon = menu.icon;
            const shortcut =
              menu.label === "새 상담"
                ? "Ctrl+Shift+O"
                : menu.label === "검색"
                  ? "Ctrl+K"
                  : undefined;
            const itemClassName = cn(
              "group relative flex h-11 w-[276px] items-center pr-3 text-sm font-bold transition-colors duration-150",
              menu.active
                ? "text-brand"
                : menu.disabled
                  ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                  : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
            );

            const itemContent = (
              <>
                {isOpen && (
                  <span
                    id={menu.label === "매장 지도" ? "vita-store-map-tour" : undefined}
                    className={cn(
                      "absolute inset-y-0 left-2 right-2 rounded-xl transition-colors",
                      menu.active
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
                      !isOpen && menu.active
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
          <p className="mb-2 px-3 text-xs font-bold text-gray-400">
            최근 상담
          </p>

          <div className="space-y-1">
            {recentChats.map((chat) => (
              <button
                key={chat.title}
                type="button"
                className={cn(
                  "mx-1 w-[calc(100%-0.5rem)] truncate rounded-xl px-5 py-3 text-left text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                  chat.active
                    ? "bg-white text-brand dark:bg-white/10"
                    : "bg-transparent text-gray-500 hover:bg-gray-300/70 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white",
                )}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("mt-auto py-3", isOpen ? "border-t border-gray-200/80 dark:border-white/10" : "")}>
        {isOpen ? (
          <div className="group relative flex h-12 w-[276px] items-center pr-3 text-left transition-colors">
            <span className="absolute inset-y-0 left-2 right-2 rounded-xl transition group-hover:bg-gray-300/70 dark:group-hover:bg-white/10" />

            <button
              type="button"
              className="relative z-10 flex h-12 min-w-0 flex-1 items-center text-left"
              aria-label="프로필"
              onMouseEnter={onShowRailTooltip("프로필")}
              onMouseLeave={onHideTooltip}
            >
              <span className="flex h-12 w-[64px] shrink-0 items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[11px] font-black text-white">
                    V
                  </span>
                </span>
              </span>

              <span className="min-w-0 opacity-100 transition-opacity delay-150 duration-150">
                <span className="block truncate text-sm font-bold text-gray-950 dark:text-white">
                  사용자
                </span>

                <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                  VITA 회원
                </span>
              </span>
            </button>

            <ThemeToggleButton
              className="relative z-10 ml-auto shrink-0"
            />
          </div>
        ) : (
          <div className="flex h-12 w-[64px] items-center justify-center">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-300/70 dark:hover:bg-white/10"
              aria-label="프로필"
              onMouseEnter={onShowRailTooltip("프로필")}
              onMouseLeave={onHideTooltip}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[11px] font-black text-white">
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

"use client";

import type { MouseEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { CircleHelp, Moon, Sun } from "lucide-react";
import { ChatAccountMenu } from "@/features/chat/components/ChatAccountMenu";
import { usePointerDownOutside } from "@/features/chat/hooks/usePointerDownOutside";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { cn } from "@/shared/lib/cn";
import { LogoutConfirmDialog } from "@/shared/ui/LogoutConfirmDialog";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { useTheme } from "@/shared/ui/ThemeProvider";
import { showToast } from "@/shared/ui/ToastProvider";
import { UserAvatar } from "@/shared/ui/UserAvatar";

type ChatSidebarFooterProps = {
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isOpen: boolean;
  onHideTooltip: () => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onShowRailTooltip: (
    label: string,
    shortcut?: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onStartTour: () => void;
};

const guestMenuButtonClassName =
  "flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-bold text-gray-600 transition hover:bg-gray-300/70 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white";

export const ChatSidebarFooter = ({
  isAuthReady,
  isAuthenticated,
  isGuest,
  isOpen,
  onHideTooltip,
  onOpenLogin,
  onOpenProfile,
  onShowRailTooltip,
  onStartTour,
}: ChatSidebarFooterProps) => {
  const { logout, user } = useAuthUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "사용자";
  const isDarkMode = resolvedTheme === "dark";

  const closeAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);

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

  usePointerDownOutside({
    enabled: isAccountMenuOpen,
    onPointerDownOutside: closeAccountMenu,
    ref: accountMenuRef,
  });

  return (
    <div
      className={cn(
        "relative mt-auto py-3",
        isOpen ? "border-t border-gray-200/80 dark:border-white/10" : "",
      )}
      ref={accountMenuRef}
    >
      {isAccountMenuOpen && (
        <ChatAccountMenu
          displayName={displayName}
          onLogout={() => {
            setIsAccountMenuOpen(false);
            setIsLogoutConfirmOpen(true);
          }}
          onOpenProfile={handleOpenProfile}
          onStartTour={() => {
            setIsAccountMenuOpen(false);
            onStartTour();
          }}
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
              className={guestMenuButtonClassName}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
              {isDarkMode ? "라이트 모드" : "다크 모드"}
            </button>

            <button
              type="button"
              onClick={onStartTour}
              className={guestMenuButtonClassName}
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
                로그인하면 상담 기록을 저장하고 더 정확한 통신 안내를 받을 수
                있어요.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenLogin}
              className="flex h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-950 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              로그인
            </button>
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
  );
};

"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { showToast } from "@/shared/ui/ToastProvider";
import { routes } from "@/shared/constants/routes";
import { LogoutConfirmDialog } from "@/shared/ui/LogoutConfirmDialog";

type HeaderControlsProps = {
  initialHasAccessToken?: boolean;
  onSelectComplete?: () => void;
};

const HeaderControls = ({
  initialHasAccessToken = false,
  onSelectComplete,
}: HeaderControlsProps) => {
  const { isAuthenticated, isLoading, logout, user } = useAuthUser({
    initialHasAccessToken,
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsLogoutConfirmOpen(false);
    showToast("로그아웃되었습니다.");
    onSelectComplete?.();
  };

  return (
    <div className="flex items-center gap-3">
      <ThemeToggleButton onToggleComplete={onSelectComplete} />

      {isLoading ? (
        <Link
          href={routes.login}
          onClick={onSelectComplete}
          className="bg-brand hover:bg-brand-hover inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition"
        >
          로그인
        </Link>
      ) : isAuthenticated ? (
        <div className="flex items-center gap-2">
          <Link
            href={routes.chat}
            onClick={onSelectComplete}
            className="inline-flex h-10 max-w-[148px] items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-bold text-gray-800 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <UserRound size={16} />
            <span className="truncate">{user?.name ?? "사용자"}</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-950 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 dark:hover:text-white"
            aria-label="로그아웃"
          >
            <LogOut size={16} />
          </button>

          {isLogoutConfirmOpen && user && (
            <LogoutConfirmDialog
              onCancel={() => setIsLogoutConfirmOpen(false)}
              onConfirm={handleLogout}
            />
          )}
        </div>
      ) : (
        <Link
          href={routes.login}
          onClick={onSelectComplete}
          className="bg-brand hover:bg-brand-hover inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition"
        >
          로그인
        </Link>
      )}
    </div>
  );
};

export default HeaderControls;

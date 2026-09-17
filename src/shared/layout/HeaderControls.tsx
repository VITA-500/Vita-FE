"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, UserRound } from "lucide-react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { showToast } from "@/shared/ui/ToastProvider";
import { routes } from "@/shared/constants/routes";

type HeaderControlsProps = {
  initialHasAccessToken?: boolean;
  onSelectComplete?: () => void;
};

const HeaderControls = ({
  initialHasAccessToken = false,
  onSelectComplete,
}: HeaderControlsProps) => {
  const { hasAccessToken, isAuthenticated, isLoading, logout, user } =
    useAuthUser({ initialHasAccessToken });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsLogoutConfirmOpen(false);
    showToast("로그아웃되었습니다.");
    onSelectComplete?.();
  };

  return (
    <div className="flex items-center gap-3">
      <ThemeToggleButton onToggleComplete={onSelectComplete} />

      {isLoading ? (
        hasAccessToken ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-bold text-transparent select-none dark:bg-white/10">
              <UserRound size={16} />
              <span>사용자</span>
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 select-none dark:bg-white/10" />
          </div>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-full bg-gray-100 px-5 text-sm font-bold text-transparent select-none dark:bg-white/10">
            로그인
          </span>
        )
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

          {isLogoutConfirmOpen &&
            createPortal(
              <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/35 px-6">
                <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 text-center shadow-2xl dark:bg-zinc-950">
                  <p className="text-base font-extrabold text-gray-950 dark:text-white">
                    로그아웃 하시겠습니까?
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    다시 이용하려면 로그인이 필요해요.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLogoutConfirmOpen(false)}
                      className="h-11 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                    >
                      취소
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-brand hover:bg-brand-hover h-11 rounded-2xl text-sm font-bold text-white transition"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
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

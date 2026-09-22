"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  BarChart3,
  FileQuestion,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";

const adminMenus = [
  { label: "대시보드", href: "/admin", icon: BarChart3 },
  { label: "FAQ 관리", href: "/admin/faqs", icon: FileQuestion },
  { label: "매장 관리", href: "/admin/stores", icon: Store },
] as const;

type AdminShellProps = {
  children: ReactNode;
};

export const AdminShell = ({ children }: AdminShellProps) => {
  const pathname = usePathname();
  // 데스크톱에서는 접힌 아이콘 사이드바(md:w-[64px])로 시작하고, 모바일에서는
  // 완전히 닫힌 상태로 시작해요. true로 시작하면 모바일 폭에서 배경 딤 처리가
  // 처음부터 opacity-100으로 걸려 있어 화면 전체가 흐릿하게 깨져 보였어요.
  const [isOpen, setIsOpen] = useState(false);

  const isMenuActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <main className="bg-surface-warm relative flex min-h-screen text-gray-950 dark:text-white">
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[90] bg-gray-950/35 transition-opacity duration-300 ease-out md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-label="사이드바 닫기"
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "bg-surface-muted fixed inset-y-0 left-0 z-[100] flex overflow-hidden border-r border-gray-200 transition-[width] duration-300 ease-out dark:border-white/10",
          isOpen ? "w-[220px]" : "w-0 md:w-[64px]",
        )}
      >
        <div className="flex h-full w-[220px] shrink-0 flex-col">
          <div className="flex h-16 items-center">
            <div className="flex h-16 w-[64px] shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="focus-visible:ring-brand/40 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition outline-none hover:bg-white hover:text-gray-950 focus-visible:ring-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
              >
                {isOpen ? (
                  <PanelLeftClose size={19} />
                ) : (
                  <PanelLeftOpen size={19} />
                )}
              </button>
            </div>

            <div
              className={cn(
                "flex items-center pr-3",
                isOpen
                  ? "pointer-events-auto opacity-100 transition-opacity delay-150 duration-150"
                  : "pointer-events-none opacity-0",
              )}
            >
              <Logo href="/" priority heightClassName="h-8" alt="VITA 관리자" />
            </div>
          </div>

          <nav className="flex-1 pt-4 pb-5">
            {isOpen && (
              <p className="text-caption mb-3 px-3 font-bold text-gray-400">
                관리
              </p>
            )}

            <div className="space-y-1">
              {adminMenus.map((menu) => {
                const Icon = menu.icon;
                const isActive = isMenuActive(menu.href);

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={cn(
                      "group text-body-md relative flex h-11 w-[220px] items-center pr-3 font-bold transition-colors duration-150",
                      isActive
                        ? "text-brand"
                        : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white",
                    )}
                  >
                    {isOpen && (
                      <span
                        className={cn(
                          "absolute inset-y-0 right-2 left-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-white dark:bg-white/10"
                            : "group-hover:bg-gray-300/70 dark:group-hover:bg-white/10",
                        )}
                      />
                    )}

                    <span className="relative z-10 flex h-11 w-[64px] shrink-0 items-center justify-center">
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg transition",
                          !isOpen && isActive
                            ? "bg-white text-gray-950 dark:bg-white/10 dark:text-white"
                            : !isOpen
                              ? "group-hover:bg-gray-300/70 group-hover:text-gray-950 dark:group-hover:bg-white/10 dark:group-hover:text-white"
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
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      <div
        className={cn(
          "min-w-0 flex-1 transition-[padding-left] duration-300 ease-out",
          isOpen ? "pl-0 md:pl-[220px]" : "pl-0 md:pl-[64px]",
        )}
      >
        <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <button
            type="button"
            className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="사이드바 열기"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={22} />
          </button>

          {children}
        </div>
      </div>
    </main>
  );
};

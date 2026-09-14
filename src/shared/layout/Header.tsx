"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import HeaderControls from "@/shared/layout/HeaderControls";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/Logo";

const navItems = [
  { label: "서비스 소개", href: `${routes.home}#service-intro` },
  { label: "주요 기능", href: `${routes.home}#features` },
  { label: "이용 흐름", href: `${routes.home}#service-flow` },
] as const;

const HEADER_HIDE_SCROLL_Y = 140;
const HEADER_SHOW_TOP_Y = 64;
const HEADER_DELTA_THRESHOLD = 48;

const Header = () => {
  const pathname = usePathname();

  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const lastScrollY = useRef(0);
  const accumulatedScrollDelta = useRef(0);
  const frameId = useRef<number | null>(null);
  const isMobileMenuOpen = mobileMenuPath === pathname;
  const shouldHideHeader =
    pathname === routes.home && !isMobileMenuOpen && isHeaderHidden;

  useEffect(() => {
    if (pathname !== routes.home || isMobileMenuOpen) {
      return;
    }

    const handleScroll = () => {
      if (frameId.current !== null) {
        return;
      }

      frameId.current = window.requestAnimationFrame(() => {
        frameId.current = null;

        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - lastScrollY.current;

        if (currentScrollY < HEADER_SHOW_TOP_Y) {
          accumulatedScrollDelta.current = 0;
          setIsHeaderHidden(false);
          lastScrollY.current = currentScrollY;
          return;
        }

        if (Math.abs(scrollDifference) < 2) {
          lastScrollY.current = currentScrollY;
          return;
        }

        if (
          Math.sign(scrollDifference) !==
          Math.sign(accumulatedScrollDelta.current)
        ) {
          accumulatedScrollDelta.current = 0;
        }

        accumulatedScrollDelta.current += scrollDifference;

        if (
          currentScrollY > HEADER_HIDE_SCROLL_Y &&
          accumulatedScrollDelta.current > HEADER_DELTA_THRESHOLD
        ) {
          setIsHeaderHidden(true);
          accumulatedScrollDelta.current = 0;
        } else if (accumulatedScrollDelta.current < -HEADER_DELTA_THRESHOLD) {
          setIsHeaderHidden(false);
          accumulatedScrollDelta.current = 0;
        }

        lastScrollY.current = currentScrollY;
      });
    };

    lastScrollY.current = window.scrollY;

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frameId.current !== null) {
        window.cancelAnimationFrame(frameId.current);
      }

      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, isMobileMenuOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  if (pathname === routes.login) {
    return null;
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 z-50 w-full transform-gpu border-b border-gray-200 bg-white/80 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform dark:border-gray-800 dark:bg-black/80 ${
          shouldHideHeader ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
          {/* 로고 */}
          <Logo
            href={routes.home}
            priority
            heightClassName="h-11"
            alt="VITA Logo"
            onClick={() => setMobileMenuPath(null)}
          />

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 데스크탑 테마 / 로그인 컨트롤 */}
          <div className="hidden md:block">
            <HeaderControls />
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuPath((currentPath) =>
                currentPath === pathname ? null : pathname,
              );
              setIsHeaderHidden(false);
            }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-100 md:hidden dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10"
            aria-label="mobile menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* 모바일 메뉴 - 부드럽게 열림/닫힘 */}
        <div
          className={`border-t bg-white transition-all duration-300 ease-out md:hidden dark:bg-black ${
            isMobileMenuOpen
              ? "max-h-[680px] overflow-visible border-gray-200 opacity-100 dark:border-gray-800"
              : "max-h-0 overflow-hidden border-transparent opacity-0 dark:border-transparent"
          }`}
        >
          <div
            className={`px-6 transition-all duration-300 ease-out ${
              isMobileMenuOpen ? "translate-y-0 py-5" : "-translate-y-3 py-0"
            }`}
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuPath(null)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-800">
              <HeaderControls
                onSelectComplete={() => setMobileMenuPath(null)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* fixed header 공간 확보 */}
      <div className="h-16" />
    </>
  );
};

export default Header;

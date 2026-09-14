"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_SCROLL_TOP_AT = 560;
const HIDE_SCROLL_TOP_AT = 440;

const ScrollTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsVisible((currentVisible) => {
        if (currentVisible) {
          return currentScrollY > HIDE_SCROLL_TOP_AT;
        }

        return currentScrollY > SHOW_SCROLL_TOP_AT;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClickTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClickTop}
      aria-label="scroll to top"
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-lg shadow-black/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-gray-100 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={22} strokeWidth={2.5} />
    </button>
  );
};

export default ScrollTopButton;

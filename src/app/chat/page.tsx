"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatModeToggle } from "@/features/chat/components/ChatModeToggle";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { PromptSuggestions } from "@/features/chat/components/PromptSuggestions";
import {
  RailTooltip,
  type RailTooltipProps,
} from "@/features/chat/components/RailTooltip";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { cn } from "@/shared/lib/cn";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  useChatTour();

  const showRailTooltip =
    (label: string, shortcut?: string) => (event: MouseEvent<HTMLElement>) => {
      if (isSidebarOpen) return;

      const rect = event.currentTarget.getBoundingClientRect();
      setRailTooltip({
        label,
        shortcut,
        y: rect.top + rect.height / 2,
      });
    };
  const showHeaderTooltip =
    (label: string) => (event: MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setRailTooltip({
        label,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        placement: "bottom",
      });
    };

  return (
    <main className="relative h-screen overflow-hidden bg-surface-warm text-gray-950 dark:text-white">
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[90] bg-gray-950/35 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-label="사이드바 닫기"
        onClick={() => setIsSidebarOpen(false)}
      />

      <ChatSidebar
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onShowRailTooltip={showRailTooltip}
        onShowHeaderTooltip={showHeaderTooltip}
        onHideTooltip={() => setRailTooltip(null)}
      />

      {/* Main */}
      <section
        className={cn(
          "flex h-full min-w-0 flex-col bg-surface-warm pl-0 transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSidebarOpen ? "md:pl-[276px]" : "md:pl-[64px]",
        )}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          <button
            type="button"
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white md:hidden"
            aria-label="사이드바 열기"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <ChatModeToggle />

          <div className="mx-auto flex min-h-full w-full max-w-[860px] flex-col justify-center px-6 pb-16 pt-36">
            <h1 className="mb-3 text-center text-3xl font-semibold tracking-normal text-gray-950 dark:text-white">
              무엇을 도와드릴까요?
            </h1>

            <p className="mb-9 text-center text-sm font-normal text-gray-500 dark:text-gray-400">
              통신 서비스에 대해 궁금한 내용을 편하게 물어보세요.
            </p>

            <ChatComposer />
            <PromptSuggestions />
          </div>
        </div>
      </section>

      {railTooltip && <RailTooltip {...railTooltip} />}
    </main>
  );
};

export default ChatPage;

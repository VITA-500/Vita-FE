"use client";

import type { MouseEvent } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatMessageList } from "@/features/chat/components/ChatMessageList";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatSearchDialog } from "@/features/chat/components/ChatSearchDialog";
import { GuestNewChatDialog } from "@/features/chat/components/GuestNewChatDialog";
import { PromptSuggestions } from "@/features/chat/components/PromptSuggestions";
import { mockChatAnswers } from "@/features/chat/constants";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";
import type { ChatMessage, ChatMode } from "@/features/chat/types";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const activeMode: ChatMode =
    searchParams.get("mode") === "store" ? "store" : "chat";
  const hasChatStarted = messages.length > 0;

  useChatTour();

  useEffect(() => {
    if (activeMode !== "chat" || messages.length === 0) return;

    window.requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      window.requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    });
  }, [activeMode, chatStatus, messages.length]);

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

  const createAssistantMessage = (prompt: string): ChatMessage => {
    const matchedAnswer =
      mockChatAnswers.find((answer) => prompt.includes(answer.matcher)) ??
      mockChatAnswers[1];

    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: matchedAnswer.answer,
      createdAt: new Date().toISOString(),
      sources: matchedAnswer.sources,
      actions: "actions" in matchedAnswer ? matchedAnswer.actions : undefined,
    };
  };

  const createStoreGuideMessage = (): ChatMessage => {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "가까운 매장은 매장 지도에서 위치 기준으로 확인할 수 있어요. 위치 권한을 허용하면 가까운 매장부터 정렬해서 보여드릴게요.",
      createdAt: new Date().toISOString(),
      actions: [
        {
          label: "가까운 매장 보기",
          href: `${routes.chat}?mode=store`,
        },
      ],
    };
  };

  const createFallbackAssistantMessage = (prompt: string): ChatMessage => {
    if (/매장|대리점|지점|방문|길찾기/.test(prompt)) {
      return createStoreGuideMessage();
    }

    return createAssistantMessage(prompt);
  };

  const submitChatPrompt = async (prompt: string = chatInput) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || chatStatus === "loading") return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
      createdAt: new Date().toISOString(),
    };

    if (!currentChatTitle) {
      setCurrentChatTitle(
        trimmedPrompt.length > 18
          ? `${trimmedPrompt.slice(0, 18)}...`
          : trimmedPrompt,
      );
    }

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setChatInput("");
    setChatStatus("loading");
    window.requestAnimationFrame(() => chatInputRef.current?.focus());

    window.setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        createFallbackAssistantMessage(trimmedPrompt),
      ]);
      setChatStatus("idle");
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }, 650);
  };

  const resetChat = () => {
    setMessages([]);
    setChatInput("");
    setCurrentChatTitle("");
    setChatStatus("idle");
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const startNewChat = () => {
    resetChat();

    if (activeMode === "store") {
      router.replace(routes.chat);
    }
  };

  const handleNewChat = () => {
    if (!isAuthenticated && !isAuthLoading && hasChatStarted) {
      setIsGuestNewChatDialogOpen(true);
      return;
    }

    startNewChat();
  };

  return (
    <main className="bg-surface-warm relative h-screen overflow-hidden text-gray-950 dark:text-white">
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
        isAuthenticated={isAuthenticated}
        isAuthLoading={isAuthLoading}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSearch={() => {
          setRailTooltip(null);
          setIsSearchOpen(true);
        }}
        onShowRailTooltip={showRailTooltip}
        onShowHeaderTooltip={showHeaderTooltip}
        onHideTooltip={() => setRailTooltip(null)}
        activeMode={activeMode}
        currentChatTitle={currentChatTitle}
      />

      {/* Main */}
      <section
        className={cn(
          "bg-surface-warm flex h-full min-w-0 flex-col pl-0 transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSidebarOpen ? "md:pl-[276px]" : "md:pl-[64px]",
        )}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <button
            type="button"
            className={cn(
              "absolute top-4 left-4 z-10 h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
              activeMode === "store" ? "hidden" : "flex",
            )}
            aria-label="사이드바 열기"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          {activeMode === "store" ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <StoreMapPanel onOpenSidebar={() => setIsSidebarOpen(true)} />
            </div>
          ) : (
            <div className="relative min-h-0 flex-1">
              {hasChatStarted ? (
                <>
                  <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto"
                  >
                    <div className="mx-auto min-h-full w-full max-w-[860px] px-6 pt-16 pb-36 md:pt-20">
                      <div>
                        <ChatMessageList
                          isLoading={chatStatus === "loading"}
                          messages={messages}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-warm/95 pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pt-4 pb-6 backdrop-blur">
                    <div className="pointer-events-auto mx-auto w-full max-w-[860px]">
                      <ChatComposer
                        inputRef={chatInputRef}
                        isLoading={chatStatus === "loading"}
                        value={chatInput}
                        onChange={setChatInput}
                        onSubmit={() => submitChatPrompt()}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="mx-auto flex h-full w-full max-w-[860px] flex-col justify-center px-6 pt-16 pb-10">
                  <div className="pb-8">
                    <h1 className="text-text-primary mb-3 text-center text-3xl font-semibold tracking-normal dark:text-white">
                      무엇을 도와드릴까요?
                    </h1>

                    <p className="text-text-secondary text-center text-sm font-normal dark:text-gray-400">
                      통신 서비스에 대해 궁금한 내용을 편하게 물어보세요.
                    </p>
                  </div>

                  <div className="mx-auto w-full max-w-[760px]">
                    <ChatComposer
                      inputRef={chatInputRef}
                      isLoading={chatStatus === "loading"}
                      value={chatInput}
                      onChange={setChatInput}
                      onSubmit={() => submitChatPrompt()}
                    />
                  </div>

                  <PromptSuggestions onSelectPrompt={submitChatPrompt} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {railTooltip && <RailTooltip {...railTooltip} />}
      <ChatSearchDialog
        currentChatTitle={currentChatTitle}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      {isGuestNewChatDialogOpen && (
        <GuestNewChatDialog
          onCancel={() => setIsGuestNewChatDialogOpen(false)}
          onConfirm={() => {
            startNewChat();
            setIsGuestNewChatDialogOpen(false);
          }}
        />
      )}
    </main>
  );
};

const ChatPage = () => (
  <Suspense fallback={null}>
    <ChatPageContent />
  </Suspense>
);

export default ChatPage;

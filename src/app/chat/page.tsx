"use client";

import type { MouseEvent } from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { ChatConversationContent } from "@/features/chat/components/ChatConversationContent";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatSearchDialog } from "@/features/chat/components/ChatSearchDialog";
import { GuestNewChatDialog } from "@/features/chat/components/GuestNewChatDialog";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";
import type { ChatMode } from "@/features/chat/types";
import { useChatConversationController } from "@/features/chat/hooks/useChatConversationController";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isReady: isAuthReady,
    user,
  } = useAuthUser();
  // 매장 지도(?mode=store)로 바로 들어오면 사이드바를 닫은 상태로 시작한다.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => searchParams.get("mode") !== "store",
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const modeParam = searchParams.get("mode");
  const routeMode: ChatMode =
    modeParam === "store" || modeParam === "profile" ? modeParam : "chat";
  const activeMode: ChatMode = routeMode;
  // 채팅 등 다른 화면에서 매장 지도로 전환될 때도 지도를 넓게 보도록 사이드바를 닫는다.
  const [sidebarModeSnapshot, setSidebarModeSnapshot] = useState(activeMode);

  if (sidebarModeSnapshot !== activeMode) {
    setSidebarModeSnapshot(activeMode);

    if (activeMode === "store") {
      setIsSidebarOpen(false);
    }
  }
  const startChatTour = useChatTour();
  const {
    chatInput,
    chatInputRef,
    chatSessions,
    chatStatus,
    editAndResubmitPrompt,
    editHintMessageId,
    currentChatTitle,
    currentSessionId,
    handleSelectChat,
    hasChatStarted,
    hasLoadedRecentChats,
    loadingSessionId,
    messages,
    scrollContainerRef,
    sessionTitles,
    setChatInput,
    startNewChat,
    streamingReply,
    retryAnswer,
    stopChatAnswer,
    submitChatPrompt,
  } = useChatConversationController({
    activeMode,
    currentUserId: user?.userId,
    hasUser: Boolean(user),
    isAuthenticated,
    isAuthReady,
    onRequireChatMode: () => router.replace(routes.chat),
  });

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
        isAuthReady={isAuthReady}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSearch={() => {
          setRailTooltip(null);
          setIsSearchOpen(true);
        }}
        onOpenProfile={() => {
          setRailTooltip(null);
          router.push(routes.myPage);
        }}
        onStartTour={() => {
          setRailTooltip(null);

          if (activeMode !== "chat") {
            router.replace(routes.chat);
          }

          window.setTimeout(() => {
            void startChatTour();
          }, 120);
        }}
        onShowRailTooltip={showRailTooltip}
        onShowHeaderTooltip={showHeaderTooltip}
        onHideTooltip={() => setRailTooltip(null)}
        activeMode={activeMode}
        currentChatTitle={currentChatTitle}
        chatSessions={chatSessions}
        pendingSessionId={loadingSessionId}
        activeSessionId={currentSessionId ?? null}
        sessionTitles={sessionTitles}
        isRecentChatsLoading={
          !isAuthReady || (isAuthenticated && !hasLoadedRecentChats)
        }
        onSelectChat={(targetSessionId) => {
          void handleSelectChat(targetSessionId);
        }}
      />

      {/* Main */}
      <section
        className={cn(
          "bg-surface-warm flex h-full min-w-0 flex-col pl-0 transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSidebarOpen ? "md:pl-[296px]" : "md:pl-[64px]",
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
          ) : activeMode === "profile" ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <ProfilePanel />
            </div>
          ) : (
            <ChatConversationContent
              chatInput={chatInput}
              chatInputRef={chatInputRef}
              chatStatus={chatStatus}
              editHintMessageId={editHintMessageId}
              hasChatStarted={hasChatStarted}
              loadingSessionId={loadingSessionId}
              messages={messages}
              onChatInputChange={setChatInput}
              onEditPrompt={editAndResubmitPrompt}
              onRetryAnswer={retryAnswer}
              onStopAnswer={stopChatAnswer}
              onSubmitPrompt={(prompt) => void submitChatPrompt(prompt)}
              scrollContainerRef={scrollContainerRef}
              streamingReply={streamingReply}
            />
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

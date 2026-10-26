"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { ChatModeContent } from "./_components/ChatModeContent";
import { ChatPageDialogs } from "./_components/ChatPageDialogs";
import { ChatPageSidebar } from "./_components/ChatPageSidebar";
import { useChatSidebarOpen } from "./_hooks/useChatSidebarOpen";
import { useRailTooltip } from "./_hooks/useRailTooltip";
import { getStoreMapInitialAction, toChatMode } from "./_lib/chatPageParams";
import { useChatConversationController } from "@/features/chat";
import { useChatTour } from "@/features/chat";
import { useAuthUser } from "@/entities/user";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { RailTooltip } from "@/shared/ui/molecules/RailTooltip";
import { StoreMapLoginProvider, useStoreMapLogin } from "@/features/store";

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthUser();
  const { isAuthenticated, isLoading: isAuthLoading, isReady, user } = auth;
  const activeMode = toChatMode(searchParams.get("mode"));
  const storeMapInitialAction = getStoreMapInitialAction(searchParams);
  const sidebar = useChatSidebarOpen(activeMode);
  const tooltip = useRailTooltip(sidebar.isOpen);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const startChatTour = useChatTour();
  const conversation = useChatConversationController({
    activeMode,
    currentUserId: user?.userId,
    hasUser: Boolean(user),
    isAuthenticated,
    isAuthReady: isReady,
    onRequireChatMode: () => router.replace(routes.chat),
  });

  /** 투어는 채팅 화면 기준이라, 다른 화면이면 채팅으로 옮긴 뒤 시작한다. */
  const startTour = () => {
    if (activeMode !== "chat") {
      router.replace(routes.chat);
    }

    window.setTimeout(() => {
      void startChatTour();
    }, 120);
  };

  const handleNewChat = () => {
    if (!isAuthenticated && !isAuthLoading && conversation.hasChatStarted) {
      setIsGuestNewChatDialogOpen(true);
      return;
    }

    conversation.startNewChat();
  };

  const { beforeLogin } = useStoreMapLogin();

  return (
    <main
      // 모바일 브라우저는 100vh가 주소창·툴바 뒤까지 잡혀 아래쪽(채팅 입력창·지도 바텀 시트)이 가려지므로, 실제 보이는 높이(dvh)를 쓴다.
      className="bg-surface-warm relative h-dvh overflow-hidden text-gray-950 dark:text-white"
    >
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[90] bg-gray-950/35 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
          sidebar.isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-label="사이드바 닫기"
        onClick={() => sidebar.setIsOpen(false)}
      />

      <ChatPageSidebar
        activeMode={activeMode}
        auth={auth}
        conversation={conversation}
        isOpen={sidebar.isOpen}
        onNewChat={handleNewChat}
        onBeforeLogin={
          activeMode === "store" ? (beforeLogin ?? undefined) : undefined
        }
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSetOpen={sidebar.setIsOpen}
        onStartTour={startTour}
        tooltip={tooltip}
      />

      {/* Main */}
      <section
        className={cn(
          "bg-surface-warm flex h-full min-w-0 flex-col pl-0 transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebar.isOpen ? "md:pl-[296px]" : "md:pl-[64px]",
        )}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <button
            type="button"
            className={cn(
              "absolute top-4 left-4 z-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
              activeMode === "store" ? "hidden" : "flex",
            )}
            aria-label="사이드바 열기"
            onClick={() => sidebar.setIsOpen(true)}
          >
            <PanelLeft size={22} />
          </button>

          <ChatModeContent
            activeMode={activeMode}
            conversation={conversation}
            isAuthenticated={isAuthenticated}
            onOpenSidebar={() => sidebar.setIsOpen(true)}
            storeMapInitialAction={storeMapInitialAction}
          />
        </div>
      </section>

      {tooltip.tooltip && <RailTooltip {...tooltip.tooltip} />}
      <ChatPageDialogs
        conversation={conversation}
        isGuestNewChatOpen={isGuestNewChatDialogOpen}
        isSearchOpen={isSearchOpen}
        isSettingsOpen={isSettingsOpen}
        onCloseGuestNewChat={() => setIsGuestNewChatDialogOpen(false)}
        onCloseSearch={() => setIsSearchOpen(false)}
        onCloseSettings={() => setIsSettingsOpen(false)}
        onStartTour={startTour}
      />
    </main>
  );
};

const ChatPage = () => (
  <Suspense fallback={null}>
    <StoreMapLoginProvider>
      <ChatPageContent />
    </StoreMapLoginProvider>
  </Suspense>
);

export default ChatPage;

"use client";

import type { MouseEvent } from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { ChatStoreMap } from "./_components/ChatStoreMap";
import { ChatConversationContent } from "@/features/chat/conversation/components/ChatConversationContent";
import { ChatStoreMapSlotProvider } from "@/features/chat/store/components/ChatStoreMapSlot";
import { ChatSidebar } from "@/features/chat/sidebar/components/ChatSidebar";
import { ChatSearchDialog } from "@/features/chat/search/components/ChatSearchDialog";
import { ChatSettingsPanel } from "@/features/chat/settings/components/ChatSettingsPanel";
import { GuestNewChatDialog } from "@/features/chat/conversation/components/GuestNewChatDialog";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { StoreMapPanel } from "@/features/store/panel/components/StoreMapPanel";
import { useIsDesktopViewport } from "@/shared/hooks/useIsDesktopViewport";
import {
  RailTooltip,
  type RailTooltipProps,
} from "@/shared/ui/molecules/RailTooltip";
import type {
  ChatMode,
  ChatStoreMap as ChatStoreMapData,
} from "@/features/chat/types";
import type {
  MapCategory,
  StoreMapInitialAction,
} from "@/features/store/types";
import type { StoreRouteMode } from "@/entities/route";
import { useChatConversationController } from "@/features/chat/conversation/hooks/useChatConversationController";
import { useChatTour } from "@/features/chat/conversation/hooks/useChatTour";
import { buildLoginHref, useAuthUser } from "@/entities/user";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    hasAccessToken,
    isAuthenticated,
    isLoading: isAuthLoading,
    isReady: isAuthReady,
    user,
  } = useAuthUser();
  // 사이드바 열림 상태는 데스크톱·모바일을 따로 둔다.
  // - 데스크톱: 매장 지도(?mode=store)로 바로 들어오면 닫은(접은) 상태, 그 외에는 펼친 상태로 시작한다.
  // - 모바일: 사이드바가 화면을 덮는 서랍이라 항상 닫힌 상태로 시작하고, 좌측 상단 버튼으로 연다.
  const isDesktop = useIsDesktopViewport();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(
    () => searchParams.get("mode") !== "store",
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isSidebarOpen = isDesktop ? isDesktopSidebarOpen : isMobileSidebarOpen;
  const setIsSidebarOpen = (nextIsOpen: boolean) => {
    if (isDesktop) {
      setIsDesktopSidebarOpen(nextIsOpen);
      return;
    }

    setIsMobileSidebarOpen(nextIsOpen);
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const modeParam = searchParams.get("mode");
  const routeMode: ChatMode =
    modeParam === "store" || modeParam === "profile" ? modeParam : "chat";
  const activeMode: ChatMode = routeMode;
  const storeMapInitialAction = getStoreMapInitialAction(searchParams);
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
    deleteChatSession,
    handleSelectChat,
    hasChatStarted,
    hasLoadedRecentChats,
    feedbackMessageIds,
    loadingSessionId,
    messages,
    pinnedSessionIds,
    renameChatSession,
    scrollContainerRef,
    sessionTitles,
    setChatInput,
    startNewChat,
    streamingReply,
    retryAnswer,
    sendAnswerFeedback,
    stopChatAnswer,
    submitChatPrompt,
    togglePinChatSession,
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
    <main
      // 모바일 브라우저는 100vh가 주소창·툴바 뒤까지 잡혀 아래쪽(채팅 입력창·지도 바텀 시트)이 가려지므로, 실제 보이는 높이(dvh)를 쓴다.
      className="bg-surface-warm relative h-dvh overflow-hidden text-gray-950 dark:text-white"
    >
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
        isAuthExpired={hasAccessToken && !isAuthenticated && isAuthReady}
        isAuthLoading={isAuthLoading}
        isAuthReady={isAuthReady}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onOpenHome={() => router.push(routes.home)}
        onNewChat={handleNewChat}
        // 로그인 후 지금 보던 화면(상담·매장 지도·마이페이지)으로 돌아온다.
        onOpenLogin={() =>
          router.push(
            buildLoginHref(
              `${window.location.pathname}${window.location.search}`,
            ),
          )
        }
        onOpenSearch={() => {
          setRailTooltip(null);
          setIsSearchOpen(true);
        }}
        onOpenProfile={() => {
          setRailTooltip(null);
          router.push(routes.myPage);
        }}
        onOpenSettings={() => {
          setRailTooltip(null);
          setIsSettingsOpen(true);
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
        onOpenCurrentChat={() => {
          setRailTooltip(null);

          // 길찾기 등 매장 지도에서 돌아올 때. 대화는 화면 상태·저장소에 그대로 있어 다시 불러오지 않는다.
          if (activeMode !== "chat") {
            router.replace(routes.chat);
          }
        }}
        isCurrentChatAnswering={chatStatus === "loading"}
        pinnedSessionIds={pinnedSessionIds}
        onTogglePinChat={togglePinChatSession}
        onRenameChat={renameChatSession}
        onDeleteChat={deleteChatSession}
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
              "absolute top-4 left-4 z-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:hidden dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
              activeMode === "store" ? "hidden" : "flex",
            )}
            aria-label="사이드바 열기"
            onClick={() => setIsSidebarOpen(true)}
          >
            <PanelLeft size={22} />
          </button>

          {activeMode === "store" ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <StoreMapPanel
                initialAction={storeMapInitialAction}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />
            </div>
          ) : activeMode === "profile" ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <ProfilePanel />
            </div>
          ) : (
            <ChatStoreMapSlotProvider renderStoreMap={renderChatStoreMap}>
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
                // 답변 피드백은 회원만 남길 수 있다. 비로그인이면 버튼 자체를 보여주지 않는다.
                onFeedbackAnswer={
                  isAuthenticated
                    ? (assistantMessageId, feedback, comment) =>
                        void sendAnswerFeedback(
                          assistantMessageId,
                          feedback,
                          comment,
                        )
                    : undefined
                }
                onRetryAnswer={retryAnswer}
                feedbackMessageIds={feedbackMessageIds}
                onStopAnswer={stopChatAnswer}
                onSelectQuickAction={(prompt) => {
                  void submitChatPrompt(prompt);
                }}
                onSubmitPrompt={(prompt) => void submitChatPrompt(prompt)}
                scrollContainerRef={scrollContainerRef}
                streamingReply={streamingReply}
              />
            </ChatStoreMapSlotProvider>
          )}
        </div>
      </section>

      {railTooltip && <RailTooltip {...railTooltip} />}
      <ChatSearchDialog
        chatSessions={chatSessions}
        currentChatTitle={currentChatTitle}
        currentSessionId={currentSessionId ?? null}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChat={(targetSessionId) => {
          void handleSelectChat(targetSessionId);
        }}
      />
      <ChatSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStartTour={() => {
          if (activeMode !== "chat") {
            router.replace(routes.chat);
          }

          window.setTimeout(() => {
            void startChatTour();
          }, 120);
        }}
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

const storeRouteModes = new Set<StoreRouteMode>([
  "walk",
  "car",
  "bicycle",
  "transit",
]);

const getStoreMapInitialAction = (
  searchParams: ReturnType<typeof useSearchParams>,
): StoreMapInitialAction | null => {
  const storeId = searchParams.get("storeId");
  const actionParam = searchParams.get("action");

  if (!storeId || (actionParam !== "select" && actionParam !== "route")) {
    return null;
  }

  const routeModeParam = searchParams.get("routeMode");
  const routeMode = storeRouteModes.has(routeModeParam as StoreRouteMode)
    ? (routeModeParam as StoreRouteMode)
    : undefined;
  const categoryParam = searchParams.get("category");
  const category: MapCategory | undefined =
    categoryParam === "benefit" || categoryParam === "store"
      ? categoryParam
      : undefined;

  return {
    action: actionParam,
    activeServices: searchParams.getAll("service"),
    benefitCategory: searchParams.get("benefitCategory") ?? undefined,
    category,
    routeMode,
    storeId,
  };
};

const ChatPage = () => (
  <Suspense fallback={null}>
    <ChatPageContent />
  </Suspense>
);

/** 답변 속 매장 지도 블록. 채팅(feature)과 매장 지도(feature)를 여기서 조립한다. */
const renderChatStoreMap = (storeMap: ChatStoreMapData) => (
  <ChatStoreMap storeMap={storeMap} />
);

export default ChatPage;

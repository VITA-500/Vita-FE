"use client";

import type { MouseEvent } from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatMessageList } from "@/features/chat/components/ChatMessageList";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatSearchDialog } from "@/features/chat/components/ChatSearchDialog";
import { GuestNewChatDialog } from "@/features/chat/components/GuestNewChatDialog";
import { PromptSuggestions } from "@/features/chat/components/PromptSuggestions";
import {
  chatService,
  claimGuestChatSessions,
} from "@/features/chat/lib/chatService";
import {
  guestChatStorage,
  type ChatSessionOwner,
} from "@/features/chat/lib/guestChatStorage";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";
import type {
  ChatMessage,
  ChatMessageApiResponse,
  ChatMode,
  ChatSessionSummary,
  SessionMessage,
} from "@/features/chat/types";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/ui/ToastProvider";

const STORE_PROMPT_PATTERN = /매장|대리점|지점|방문|길찾기/;
const FAILED_ANSWER_MESSAGE =
  "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";

const toChatTitle = (prompt: string) =>
  prompt.length > 18 ? `${prompt.slice(0, 18)}...` : prompt;

const storeGuideActions = [
  {
    label: "가까운 매장 보기",
    href: `${routes.chat}?mode=store`,
  },
] as const;

/** BE 메시지 기록을 화면용 메시지로 바꾼다. 실패·생성 중 메시지는 content가 null이다. */
const toChatMessage = (message: SessionMessage): ChatMessage => {
  const isUser = message.role === "USER";

  return {
    id: `${isUser ? "user" : "assistant"}-${message.messageId}`,
    role: isUser ? "user" : "assistant",
    content: message.content ?? (isUser ? "" : FAILED_ANSWER_MESSAGE),
    createdAt: message.createdAt,
  };
};

const toAssistantMessage = (
  response: ChatMessageApiResponse,
  prompt: string,
): ChatMessage => ({
  id: `assistant-${response.messageId}`,
  role: "assistant",
  content:
    response.status === "COMPLETED" && response.answer
      ? response.answer
      : FAILED_ANSWER_MESSAGE,
  createdAt: response.createAt,
  actions: STORE_PROMPT_PATTERN.test(prompt) ? storeGuideActions : undefined,
});

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isReady: isAuthReady,
  } = useAuthUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** 현재 대화의 BE 세션 id. 렌더에 쓰이지 않아 ref로만 둔다. */
  const sessionIdRef = useRef<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const modeParam = searchParams.get("mode");
  const routeMode: ChatMode =
    modeParam === "store" || modeParam === "profile" ? modeParam : "chat";
  const activeMode: ChatMode = routeMode;
  const hasChatStarted = messages.length > 0;

  const startChatTour = useChatTour();

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

  const applySessionId = useCallback((nextSessionId: number | null) => {
    sessionIdRef.current = nextSessionId;
    setActiveSessionId(nextSessionId);
  }, []);

  /** 회원의 상담 목록(GET /chat/sessions). 게스트는 BE가 빈 목록을 준다. */
  const refreshChatSessions = useCallback(async () => {
    try {
      const { sessions } = await chatService.getSessions();
      setChatSessions(sessions);
    } catch {
      setChatSessions([]);
    }
  }, []);

  /** 세션 하나의 대화 기록을 불러와 화면에 띄운다. */
  const loadChatSession = useCallback(
    async (targetSessionId: number) => {
      const response = await chatService.getMessages(targetSessionId);
      const firstPrompt = response.messages.find(
        (message) => message.role === "USER" && message.content,
      )?.content;

      applySessionId(response.sessionId);
      setMessages(response.messages.map(toChatMessage));
      setCurrentChatTitle(firstPrompt ? toChatTitle(firstPrompt) : "");
    },
    [applySessionId],
  );

  /**
   * 로그인 상태가 정해지면
   * 1) 회원이면 게스트로 나눈 대화를 계정에 귀속(claim)하고
   * 2) 보고 있던 세션(activeSession)의 대화 기록을 다시 불러온다.
   * 로그인 페이지나 소셜 로그인을 다녀와도 같은 대화로 돌아오게 하기 위함이다.
   */
  useEffect(() => {
    if (!isAuthReady || isAuthLoading) return;

    let isCancelled = false;
    const owner: ChatSessionOwner = isAuthenticated ? "member" : "guest";

    const syncChatSession = async () => {
      if (isAuthenticated) {
        const { claimedSessionIds } = await claimGuestChatSessions();

        if (!isCancelled && claimedSessionIds.length > 0) {
          showToast("로그인 전 나눈 대화를 계정에 저장했어요.");
        }

        // 귀속된 세션이 사이드바 '최근 상담'에 바로 보이도록 claim 뒤에 불러온다.
        if (!isCancelled) {
          void refreshChatSessions();
        }
      } else {
        setChatSessions([]);
      }

      const activeSession = guestChatStorage.getActiveSession();

      if (isCancelled) return;

      if (!activeSession || activeSession.owner !== owner) {
        // 로그아웃 뒤 회원 대화가 게스트 화면에 남지 않도록 비운다.
        if (activeSession) {
          guestChatStorage.clearActiveSession();
        }

        if (sessionIdRef.current !== null) {
          applySessionId(null);
          setMessages([]);
          setCurrentChatTitle("");
        }
        return;
      }

      if (sessionIdRef.current === activeSession.sessionId) return;

      setChatStatus("loading");

      try {
        if (isCancelled) return;

        await loadChatSession(activeSession.sessionId);
      } catch (error) {
        if (
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          guestChatStorage.clearActiveSession();
        }
      } finally {
        // 취소된 실행이라도 로딩 표시는 풀어 둔다 — 다음 실행이 곧바로 반환하면 멈춰 보인다.
        setChatStatus("idle");
      }
    };

    // useAuthUser와 같은 방식으로 한 프레임 뒤에 실행한다 — effect 본문에서 곧바로
    // setState가 불리지 않게 해 react-hooks(set-state-in-effect) 규칙과 연쇄 렌더를 피한다.
    const frameId = window.requestAnimationFrame(() => {
      void syncChatSession();
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [
    applySessionId,
    isAuthLoading,
    isAuthReady,
    isAuthenticated,
    loadChatSession,
    refreshChatSessions,
  ]);

  const handleSelectChat = async (targetSessionId: number) => {
    if (activeMode !== "chat") {
      router.replace(routes.chat);
    }

    if (targetSessionId === sessionIdRef.current || chatStatus === "loading") {
      return;
    }

    setChatStatus("loading");

    try {
      await loadChatSession(targetSessionId);
      guestChatStorage.setActiveSession({
        sessionId: targetSessionId,
        owner: "member",
      });
    } catch {
      showToast("상담 내역을 불러오지 못했어요.");
    } finally {
      setChatStatus("idle");
    }
  };

  /** 세션이 없으면 새로 만든다. 게스트가 만든 세션은 로그인 시 귀속 대상으로 기록한다. */
  const ensureSession = async () => {
    if (sessionIdRef.current !== null) {
      return sessionIdRef.current;
    }

    const { sessionId: createdSessionId } = await chatService.createSession();
    const owner: ChatSessionOwner = isAuthenticated ? "member" : "guest";

    if (owner === "guest") {
      guestChatStorage.addPendingGuestSession(createdSessionId);
    }

    guestChatStorage.setActiveSession({ sessionId: createdSessionId, owner });
    applySessionId(createdSessionId);

    return createdSessionId;
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
      setCurrentChatTitle(toChatTitle(trimmedPrompt));
    }

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setChatInput("");
    setChatStatus("loading");
    window.requestAnimationFrame(() => chatInputRef.current?.focus());

    try {
      const targetSessionId = await ensureSession();
      const response = await chatService.sendMessage(
        targetSessionId,
        trimmedPrompt,
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        toAssistantMessage(response, trimmedPrompt),
      ]);

      if (isAuthenticated) {
        void refreshChatSessions();
      }
    } catch (error) {
      // 세션이 사라졌거나 내 세션이 아니면 다음 질문에서 새 세션을 만들도록 비운다.
      if (error instanceof ApiError && [403, 404].includes(error.status)) {
        guestChatStorage.clearActiveSession();
        applySessionId(null);
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: FAILED_ANSWER_MESSAGE,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatStatus("idle");
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  };

  const resetChat = () => {
    const previousSessionId = sessionIdRef.current;

    // 게스트의 새 채팅은 "현재 대화가 삭제됩니다" 안내를 거친다 — 귀속 대상에서도 뺀다.
    if (previousSessionId !== null && !isAuthenticated) {
      guestChatStorage.removePendingGuestSession(previousSessionId);
    }

    guestChatStorage.clearActiveSession();
    applySessionId(null);
    setMessages([]);
    setChatInput("");
    setCurrentChatTitle("");
    setChatStatus("idle");
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const startNewChat = () => {
    resetChat();

    if (activeMode !== "chat") {
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
        activeSessionId={activeSessionId}
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

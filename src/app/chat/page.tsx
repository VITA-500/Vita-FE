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
  chatConversationStorage,
  createGuestId,
  getChatConversationOwnerKey,
  getGuestChatConversationOwnerKey,
} from "@/features/chat/lib/chatConversationStorage";
import { chatService } from "@/features/chat/lib/chatService";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";
import type {
  ChatMessage,
  ChatMode,
  ChatSessionSummary,
  SessionMessage,
} from "@/features/chat/types";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { showToast } from "@/shared/ui/ToastProvider";

const FAILED_ANSWER_MESSAGE =
  "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.";

const toChatTitle = (prompt: string) =>
  prompt.length > 18 ? `${prompt.slice(0, 18)}...` : prompt;

const toChatMessage = (message: SessionMessage): ChatMessage => {
  const isUser = message.role === "USER";

  return {
    id: `${isUser ? "user" : "assistant"}-${message.messageId}`,
    role: isUser ? "user" : "assistant",
    content: message.content ?? (isUser ? "" : FAILED_ANSWER_MESSAGE),
    createdAt: message.createdAt,
  };
};

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isReady: isAuthReady,
    user,
  } = useAuthUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [currentGuestId, setCurrentGuestId] = useState<string | undefined>();
  const [currentSessionId, setCurrentSessionId] = useState<
    number | undefined
  >();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationOwnerKeyRef = useRef("");
  const hasHydratedConversationRef = useRef(false);
  const modeParam = searchParams.get("mode");
  const routeMode: ChatMode =
    modeParam === "store" || modeParam === "profile" ? modeParam : "chat";
  const activeMode: ChatMode = routeMode;
  const hasChatStarted = messages.length > 0;

  const startChatTour = useChatTour();

  const refreshChatSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setChatSessions([]);
      return;
    }

    try {
      const { sessions } = await chatService.getSessions();
      setChatSessions(sessions);
    } catch {
      setChatSessions([]);
    }
  }, [isAuthenticated]);

  const loadChatSession = useCallback(async (targetSessionId: number) => {
    const response = await chatService.getMessages(targetSessionId);
    const nextMessages = response.messages.map(toChatMessage);
    const firstPrompt = response.messages.find(
      (message) => message.role === "USER" && message.content,
    )?.content;

    setCurrentSessionId(response.sessionId);
    setCurrentGuestId(undefined);
    setMessages(nextMessages);
    setCurrentChatTitle(firstPrompt ? toChatTitle(firstPrompt) : "");
    setChatStatus("idle");
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let isCancelled = false;

    const hydrateConversation = async () => {
      const ownerKey = getChatConversationOwnerKey(user);
      let nextConversation = chatConversationStorage.load(ownerKey);

      if (user) {
        const guestConversation = chatConversationStorage.load(
          getGuestChatConversationOwnerKey(),
        );

        if (guestConversation?.sessionId && guestConversation.guestId) {
          await chatService
            .claimGuestSession(
              guestConversation.sessionId,
              guestConversation.guestId,
            )
            .then(() => {
              nextConversation =
                chatConversationStorage.migrateGuestToUser(ownerKey) ??
                nextConversation;
            })
            .catch(() => undefined);
        }

        void refreshChatSessions();
      } else {
        setChatSessions([]);
      }

      if (isCancelled) {
        return;
      }

      activeConversationOwnerKeyRef.current = ownerKey;
      hasHydratedConversationRef.current = true;

      const frameId = window.requestAnimationFrame(() => {
        setMessages(nextConversation?.messages ?? []);
        setCurrentChatTitle(nextConversation?.title ?? "");
        setCurrentGuestId(user ? undefined : nextConversation?.guestId);
        setCurrentSessionId(nextConversation?.sessionId);
        setChatStatus("idle");
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    };

    let cancelFrame: (() => void) | undefined;

    void hydrateConversation().then((nextCancelFrame) => {
      cancelFrame = nextCancelFrame;
    });

    return () => {
      isCancelled = true;
      cancelFrame?.();
    };
  }, [isAuthReady, refreshChatSessions, user]);

  useEffect(() => {
    if (!hasHydratedConversationRef.current) {
      return;
    }

    const ownerKey = activeConversationOwnerKeyRef.current;

    if (!ownerKey) {
      return;
    }

    chatConversationStorage.save(ownerKey, {
      guestId: currentGuestId,
      messages,
      sessionId: currentSessionId,
      title: currentChatTitle,
    });
  }, [currentChatTitle, currentGuestId, currentSessionId, messages]);

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
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "일시적으로 상담 응답을 불러오지 못했어요. 잠시 후 다시 질문해 주세요.",
      createdAt: new Date().toISOString(),
    };
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
      const nextGuestId =
        isAuthenticated || user
          ? undefined
          : (currentGuestId ?? createGuestId());
      const nextSessionId =
        currentSessionId ??
        (await chatService.createSession(nextGuestId)).sessionId;

      setCurrentGuestId(nextGuestId);
      setCurrentSessionId(nextSessionId);

      const assistantMessage = await chatService.sendMessage({
        content: trimmedPrompt,
        guestId: nextGuestId,
        sessionId: nextSessionId,
      });

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);

      if (isAuthenticated) {
        void refreshChatSessions();
      }
    } catch (error) {
      console.error("Chat API request failed", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        createFallbackAssistantMessage(trimmedPrompt),
      ]);
    } finally {
      setChatStatus("idle");
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  };

  const resetChat = () => {
    setMessages([]);
    setChatInput("");
    setCurrentChatTitle("");
    setCurrentGuestId(undefined);
    setCurrentSessionId(undefined);
    setChatStatus("idle");
    chatConversationStorage.clear(activeConversationOwnerKeyRef.current);
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  const handleSelectChat = async (targetSessionId: number) => {
    if (activeMode !== "chat") {
      router.replace(routes.chat);
    }

    if (targetSessionId === currentSessionId || chatStatus === "loading") {
      return;
    }

    setChatStatus("loading");

    try {
      await loadChatSession(targetSessionId);
    } catch {
      showToast("상담 내역을 불러오지 못했어요.");
      setChatStatus("idle");
    }
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
        activeSessionId={currentSessionId ?? null}
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

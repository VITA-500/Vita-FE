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
import {
  chatService,
  FAILED_ANSWER_MESSAGE,
  isPermanentClaimError,
} from "@/features/chat/lib/chatService";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";
import type {
  ChatMessage,
  ChatMode,
  ChatSessionSummary,
  SessionMessage,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { useChatTour } from "@/features/chat/hooks/useChatTour";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { showToast } from "@/shared/ui/ToastProvider";

/** 사이드바 제목을 채우려고 상담 메시지를 동시에 조회하는 최대 개수. */
const TITLE_FETCH_CONCURRENCY = 4;
/** 최근 상담을 펼치기 전에 제목 조회를 기다리는 최대 시간. */
const TITLE_FETCH_WAIT_MS = 3000;

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
  // 매장 지도(?mode=store)로 바로 들어오면 사이드바를 닫은 상태로 시작한다.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => searchParams.get("mode") !== "store",
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuestNewChatDialogOpen, setIsGuestNewChatDialogOpen] =
    useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading">("idle");
  // 지난 상담을 불러오는 중인 세션 번호. 답변 대기(chatStatus)와 분리해서,
  // 상담을 바꿀 때 지금 보던 대화에 "생각 중" 진행 표시가 뜨지 않게 한다.
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [currentGuestId, setCurrentGuestId] = useState<string | undefined>();
  const [currentSessionId, setCurrentSessionId] = useState<
    number | undefined
  >();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  // 첫 진입·새로고침 때 최근 상담 목록(제목 포함)을 다 받아왔는지. 받기 전에는 사이드바 목록을 접어 둬서
  // 생성 시각 → 첫 질문으로 제목이 바뀌는 순간이 보이지 않게 한다.
  const [hasLoadedRecentChats, setHasLoadedRecentChats] = useState(false);
  // BE 세션 title이 항상 비어 있어서, 상담의 첫 질문을 제목으로 기억해 사이드바에 쓴다.
  const [sessionTitles, setSessionTitles] = useState<Record<number, string>>(
    {},
  );
  const [railTooltip, setRailTooltip] = useState<RailTooltipProps | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // 지난 상담으로 바꿀 때는 부드러운 스크롤 대신 바로 맨 아래로 이동한다(긴 대화에서 화면이 끌려 내려가지 않게).
  const shouldJumpToBottomRef = useRef(false);
  // 상담을 빠르게 연속 클릭했을 때 늦게 도착한 이전 응답이 화면을 덮어쓰지 않도록 마지막 요청만 반영한다.
  const latestSelectRequestRef = useRef(0);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  // 제목을 채우려고 이미 메시지를 조회한(또는 조회 중인) 상담 번호.
  const requestedTitleSessionIdsRef = useRef<Set<number>>(new Set());
  const activeConversationOwnerKeyRef = useRef("");
  const hasHydratedConversationRef = useRef(false);
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
  const hasChatStarted = messages.length > 0;

  const startChatTour = useChatTour();

  // BE 세션 목록의 title이 비어 있어서, 새로고침·첫 진입 때 사이드바가 생성 시각으로만 보였다.
  // 제목을 모르는 상담은 메시지를 조회해 첫 질문을 제목으로 채운다(한 번 조회한 상담은 다시 묻지 않음).
  const fillMissingSessionTitles = useCallback(
    async (sessions: readonly ChatSessionSummary[]) => {
      const targets = sessions.filter(
        (session) =>
          !session.title &&
          !requestedTitleSessionIdsRef.current.has(session.sessionId),
      );

      targets.forEach((session) =>
        requestedTitleSessionIdsRef.current.add(session.sessionId),
      );

      const queue = [...targets];
      const worker = async () => {
        for (let session = queue.shift(); session; session = queue.shift()) {
          try {
            const { messages: sessionMessages } = await chatService.getMessages(
              session.sessionId,
            );
            const firstPrompt = sessionMessages.find(
              (message) => message.role === "USER" && message.content,
            )?.content;

            if (!firstPrompt) continue;

            const sessionId = session.sessionId;
            setSessionTitles((titles) =>
              titles[sessionId]
                ? titles
                : { ...titles, [sessionId]: toChatTitle(firstPrompt) },
            );
          } catch {
            // 실패하면 다음 새로고침 때 다시 시도하고, 그동안은 날짜 제목을 그대로 쓴다.
            requestedTitleSessionIdsRef.current.delete(session.sessionId);
          }
        }
      };

      // 상담이 많아도 요청이 한꺼번에 몰리지 않게 동시에 몇 개씩만 조회한다.
      await Promise.all(
        Array.from(
          { length: Math.min(TITLE_FETCH_CONCURRENCY, queue.length) },
          worker,
        ),
      );
    },
    [],
  );

  const refreshChatSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setChatSessions([]);
      return;
    }

    try {
      const { sessions } = await chatService.getSessions();
      setChatSessions(sessions);
      // 처음 목록을 그릴 때는 제목이 채워질 때까지(최대 TITLE_FETCH_WAIT_MS) 기다렸다가 펼친다.
      // 너무 오래 걸리면 먼저 펼치고, 늦게 온 제목은 그대로 반영된다.
      await Promise.race([
        fillMissingSessionTitles(sessions),
        new Promise((resolve) =>
          window.setTimeout(resolve, TITLE_FETCH_WAIT_MS),
        ),
      ]);
    } catch {
      setChatSessions([]);
    } finally {
      setHasLoadedRecentChats(true);
    }
  }, [isAuthenticated, fillMissingSessionTitles]);

  const applyChatSession = useCallback((response: SessionMessagesResponse) => {
    const nextMessages = response.messages.map(toChatMessage);
    const firstPrompt = response.messages.find(
      (message) => message.role === "USER" && message.content,
    )?.content;

    shouldJumpToBottomRef.current = true;
    setCurrentSessionId(response.sessionId);
    setCurrentGuestId(undefined);
    setMessages(nextMessages);
    setCurrentChatTitle(firstPrompt ? toChatTitle(firstPrompt) : "");
    if (firstPrompt) {
      setSessionTitles((titles) => ({
        ...titles,
        [response.sessionId]: toChatTitle(firstPrompt),
      }));
    }
    setChatStatus("idle");
  }, []);

  // user 객체는 로그인 정보가 갱신될 때마다 새로 만들어진다. 객체를 의존성으로 두면
  // 대화 복원·claim이 여러 번 실행되므로 변하지 않는 userId만 본다.
  const currentUserId = user?.userId;

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let isCancelled = false;

    const hydrateConversation = async () => {
      const ownerKey = getChatConversationOwnerKey(
        currentUserId === undefined ? null : { userId: currentUserId },
      );
      let nextConversation = chatConversationStorage.load(ownerKey);

      if (currentUserId !== undefined) {
        const guestConversation =
          chatConversationStorage.load(getGuestChatConversationOwnerKey()) ??
          chatConversationStorage.loadGuestBackup();

        if (guestConversation?.messages.length) {
          nextConversation = guestConversation;
        }

        if (guestConversation?.sessionId && guestConversation.guestId) {
          await chatService
            .claimGuestSession(
              guestConversation.sessionId,
              guestConversation.guestId,
            )
            .then((response) => {
              console.info("Guest chat claim succeeded", {
                guestId: guestConversation.guestId,
                response,
                sessionId: guestConversation.sessionId,
              });
              if (!isCancelled) {
                showToast("로그인 전 상담 내역을 계정에 저장했어요.");
              }
              nextConversation = {
                ...guestConversation,
                guestId: undefined,
                sessionId: response.sessionId,
              };
              chatConversationStorage.save(ownerKey, nextConversation);
              chatConversationStorage.clear(getGuestChatConversationOwnerKey());
            })
            .catch((error) => {
              console.error("Guest chat claim failed", {
                error,
                guestId: guestConversation.guestId,
                sessionId: guestConversation.sessionId,
              });

              // 세션이 없거나 남의 세션(403/404)이면 다시 시도해도 같다 — 게스트 기록을 정리해
              // 로그인할 때마다 같은 실패 안내가 반복되지 않게 한다.
              if (isPermanentClaimError(error)) {
                chatConversationStorage.clear(
                  getGuestChatConversationOwnerKey(),
                );
              }

              if (isCancelled) {
                return;
              }

              showToast(
                "로그인 전 상담 화면은 유지했지만 저장 연동은 실패했어요.",
              );
              nextConversation = {
                ...guestConversation,
                guestId: undefined,
                sessionId: undefined,
              };
              chatConversationStorage.save(ownerKey, nextConversation);
            });
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
        setCurrentGuestId(
          currentUserId !== undefined ? undefined : nextConversation?.guestId,
        );
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
  }, [currentUserId, isAuthReady, refreshChatSessions]);

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

    const behavior: ScrollBehavior = shouldJumpToBottomRef.current
      ? "auto"
      : "smooth";
    shouldJumpToBottomRef.current = false;

    window.requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      window.requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      });
    });
  }, [activeMode, chatStatus, messages]);

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
      setSessionTitles((titles) =>
        titles[nextSessionId]
          ? titles
          : { ...titles, [nextSessionId]: toChatTitle(trimmedPrompt) },
      );

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
    // 지난 상담을 불러오는 중에 새 상담을 시작하면, 늦게 온 응답이 새 화면을 덮지 않게 무시한다.
    latestSelectRequestRef.current += 1;
    setLoadingSessionId(null);
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

    if (
      targetSessionId === currentSessionId ||
      targetSessionId === loadingSessionId ||
      chatStatus === "loading"
    ) {
      return;
    }

    const requestId = latestSelectRequestRef.current + 1;
    latestSelectRequestRef.current = requestId;
    setLoadingSessionId(targetSessionId);

    try {
      const loaded = await chatService.getMessages(targetSessionId);

      // 그사이 다른 상담을 눌렀으면 이 응답은 버린다.
      if (latestSelectRequestRef.current !== requestId) return;

      // 질문이 저장되지 못한 빈 상담은 열어도 새 상담 화면처럼 보이기만 해서, 지금 화면을 유지한다.
      if (loaded.messages.length === 0) {
        showToast("저장된 대화가 없는 상담이에요.");
        return;
      }

      applyChatSession(loaded);
    } catch {
      if (latestSelectRequestRef.current !== requestId) return;
      showToast("상담 내역을 불러오지 못했어요.");
    } finally {
      if (latestSelectRequestRef.current === requestId) {
        setLoadingSessionId(null);
      }
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
            <div className="relative min-h-0 flex-1">
              {hasChatStarted ? (
                <>
                  <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto"
                  >
                    <div className="mx-auto min-h-full w-full max-w-[860px] px-6 pt-16 pb-36 md:pt-20">
                      <div
                        aria-busy={loadingSessionId !== null}
                        className={cn(
                          "transition-opacity duration-200",
                          loadingSessionId !== null && "opacity-40",
                        )}
                      >
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

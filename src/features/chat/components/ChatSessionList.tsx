"use client";

import type { CSSProperties, MouseEvent } from "react";
import { ChevronDown, MoreHorizontal, Pin, PinOff } from "lucide-react";
import type { SidebarChatItem } from "@/features/chat/lib/chatSidebarItems";
import { cn } from "@/shared/lib/cn";

type ChatSessionListProps = {
  isCollapsed: boolean;
  isLoading: boolean;
  isRecentChatsHidden: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>, chatKey: string) => void;
  onSelectChat: (chat: SidebarChatItem) => void;
  onToggleCollapsed: () => void;
  onTogglePin: (chat: SidebarChatItem) => void;
  pinnedChats: readonly SidebarChatItem[];
  unpinnedRecentChats: readonly SidebarChatItem[];
};

/** 최근 상담을 펼칠 때 항목이 위에서부터 차례로 나타나도록 주는 지연 간격. */
const RECENT_CHAT_STAGGER_MS = 40;
/** 목록이 길어도 마지막 항목이 너무 늦게 나타나지 않도록 지연을 이 순번까지만 늘린다. */
const RECENT_CHAT_STAGGER_LIMIT = 8;

const chatRowClassName = (isActive: boolean) =>
  cn(
    "group relative mx-1 flex h-11 w-[calc(100%-0.5rem)] items-center rounded-xl text-left transition-colors duration-150",
    isActive
      ? "bg-white dark:bg-white/10"
      : "hover:bg-gray-300/70 dark:hover:bg-white/10",
  );

const chatTitleClassName = (isActive: boolean) =>
  cn(
    "focus-visible:ring-brand/30 min-w-0 flex-1 truncate px-5 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
    isActive
      ? "text-brand"
      : "text-gray-500 group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-white",
  );

const chatActionClassName =
  "mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white";

type ChatSessionRowProps = {
  chat: SidebarChatItem;
  isPinnedSection?: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>, chatKey: string) => void;
  onSelectChat: (chat: SidebarChatItem) => void;
  onTogglePin: (chat: SidebarChatItem) => void;
  style?: CSSProperties;
  className?: string;
};

const ChatSessionRow = ({
  chat,
  className,
  isPinnedSection = false,
  onOpenMenu,
  onSelectChat,
  onTogglePin,
  style,
}: ChatSessionRowProps) => (
  <div
    key={chat.key}
    style={style}
    className={cn(chatRowClassName(chat.active), className)}
  >
    <button
      type="button"
      onClick={() => onSelectChat(chat)}
      aria-current={chat.active ? "true" : undefined}
      className={chatTitleClassName(chat.active)}
    >
      {chat.title}
    </button>

    <button
      type="button"
      onClick={() => onTogglePin(chat)}
      className={chatActionClassName}
      aria-label={isPinnedSection ? "채팅 고정 해제" : "채팅 고정"}
    >
      {isPinnedSection ? <PinOff size={16} /> : <Pin size={16} />}
    </button>

    <button
      type="button"
      data-chat-menu-trigger="true"
      onClick={(event) => onOpenMenu(event, chat.key)}
      className={cn(chatActionClassName, "mr-2")}
      aria-label="채팅 메뉴"
    >
      <MoreHorizontal size={17} />
    </button>
  </div>
);

export const ChatSessionList = ({
  isCollapsed,
  isLoading,
  isRecentChatsHidden,
  onOpenMenu,
  onSelectChat,
  onToggleCollapsed,
  onTogglePin,
  pinnedChats,
  unpinnedRecentChats,
}: ChatSessionListProps) => (
  <div className="space-y-1">
    {pinnedChats.length > 0 && (
      <>
        <p className="mb-2 px-3 text-xs font-bold text-gray-400">고정됨</p>

        {pinnedChats.map((chat) => (
          <ChatSessionRow
            key={chat.key}
            chat={chat}
            isPinnedSection
            onOpenMenu={onOpenMenu}
            onSelectChat={onSelectChat}
            onTogglePin={onTogglePin}
          />
        ))}
      </>
    )}

    <button
      type="button"
      onClick={onToggleCollapsed}
      aria-expanded={!isRecentChatsHidden}
      aria-busy={isLoading || undefined}
      aria-controls="chat-sidebar-recent-list"
      className="group/recent focus-visible:ring-brand/30 mx-1 mt-4 mb-2 flex h-7 w-[calc(100%-0.5rem)] items-center gap-1 rounded-lg px-2 text-left text-xs font-bold text-gray-400 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:outline-none dark:hover:text-gray-200"
    >
      최근 상담
      <ChevronDown
        size={14}
        strokeWidth={2.2}
        aria-hidden="true"
        className={cn(
          "transition-transform duration-200",
          isRecentChatsHidden && "-rotate-90",
        )}
      />
      {isCollapsed && !isLoading && unpinnedRecentChats.length > 0 && (
        <span className="ml-auto font-semibold text-gray-400/80">
          {unpinnedRecentChats.length}
        </span>
      )}
    </button>

    <div
      id="chat-sidebar-recent-list"
      aria-hidden={isRecentChatsHidden}
      inert={isRecentChatsHidden}
      className={cn(
        "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isRecentChatsHidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "space-y-1 transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isRecentChatsHidden
              ? "-translate-y-3 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          {unpinnedRecentChats.length === 0 && (
            <p className="px-5 py-2 text-xs font-medium text-gray-400">
              아직 상담 내역이 없어요.
            </p>
          )}

          {unpinnedRecentChats.map((chat, index) => (
            <ChatSessionRow
              key={chat.key}
              chat={chat}
              className={cn(
                "[transition:background-color_150ms,opacity_450ms_cubic-bezier(0.22,1,0.36,1)_var(--recent-chat-delay),translate_450ms_cubic-bezier(0.22,1,0.36,1)_var(--recent-chat-delay)]",
                isRecentChatsHidden
                  ? "-translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100",
              )}
              style={
                {
                  "--recent-chat-delay": isRecentChatsHidden
                    ? "0ms"
                    : `${Math.min(index, RECENT_CHAT_STAGGER_LIMIT) * RECENT_CHAT_STAGGER_MS}ms`,
                } as CSSProperties
              }
              onOpenMenu={onOpenMenu}
              onSelectChat={onSelectChat}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

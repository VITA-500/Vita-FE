"use client";

import type { MouseEvent } from "react";
import { MessageSquareText, MoreHorizontal, Pin, PinOff } from "lucide-react";
import type { SidebarChatItem } from "@/features/chat/lib/chatSidebarItems";
import { cn } from "@/shared/lib/cn";

type ChatCurrentSessionProps = {
  chat: SidebarChatItem;
  /** 채팅 화면에서 이 상담을 보고 있는지. 지도·프로필 화면이면 false. */
  isActive: boolean;
  /** 답변을 만드는 중. 아이콘에 진행 점을 띄운다. */
  isAnswering: boolean;
  isGuest: boolean;
  isOpen: boolean;
  isPinned: boolean;
  onHideTooltip: () => void;
  onOpen: () => void;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>, chatKey: string) => void;
  onShowRailTooltip: (
    label: string,
    shortcut?: string,
  ) => (event: MouseEvent<HTMLElement>) => void;
  onTogglePin: (chat: SidebarChatItem) => void;
};

const actionClassName =
  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-gray-950 focus-visible:opacity-100 dark:hover:bg-white/10 dark:hover:text-white";

/**
 * 사이드바 "현재 상담". 회원·게스트 모두 지금 열린 상담으로 돌아갈 수 있게 한다
 * (예: 채팅 → 길찾기 → 다시 채팅). 사이드바를 접어도 아이콘으로 남는다.
 */
export const ChatCurrentSession = ({
  chat,
  isActive,
  isAnswering,
  isGuest,
  isOpen,
  isPinned,
  onHideTooltip,
  onOpen,
  onOpenMenu,
  onShowRailTooltip,
  onTogglePin,
}: ChatCurrentSessionProps) => {
  // 게스트 상담은 고정·삭제 설정을 저장할 계정이 없고, 첫 답변 전 상담은 서버 id가 없다.
  const canManage = !isGuest && chat.sessionId !== null;
  const label = `현재 상담: ${chat.title}`;

  return (
    <div className="mt-6">
      <p
        className={cn(
          "mb-2 flex h-5 items-center gap-1.5 px-5 text-xs font-bold whitespace-nowrap text-gray-400",
          isOpen
            ? "opacity-100 transition-opacity delay-150 duration-150"
            : "opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        현재 상담
        {isGuest && (
          <span className="font-medium text-gray-400/80">
            · 비로그인 · 새 상담 시 종료
          </span>
        )}
      </p>

      <div className="group relative flex h-11 w-[296px] items-center pr-3 text-sm font-semibold">
        {isOpen && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 right-2 left-2 rounded-xl transition-colors",
              isActive
                ? "bg-white dark:bg-white/10"
                : "group-hover:bg-gray-300/70 dark:group-hover:bg-white/10",
            )}
          />
        )}

        <button
          type="button"
          onClick={onOpen}
          aria-current={isActive ? "true" : undefined}
          aria-label={label}
          title={isOpen ? chat.title : undefined}
          onMouseEnter={onShowRailTooltip(label)}
          onMouseLeave={onHideTooltip}
          className={cn(
            "focus-visible:ring-brand/30 relative z-10 flex h-11 min-w-0 flex-1 items-center rounded-xl text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
            isActive
              ? "text-brand"
              : "text-gray-500 group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-white",
          )}
        >
          <span className="flex h-11 w-[64px] shrink-0 items-center justify-center">
            <span
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition",
                !isOpen && isActive
                  ? "bg-brand shadow-brand/25 text-white shadow-sm"
                  : !isOpen
                    ? "group-hover:bg-gray-300/70 group-hover:text-gray-950 dark:group-hover:bg-white/10 dark:group-hover:text-white"
                    : "",
              )}
            >
              <MessageSquareText size={20} strokeWidth={1.8} />
              {isAnswering && (
                <span
                  aria-hidden="true"
                  className="bg-brand absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full"
                />
              )}
            </span>
          </span>

          {isOpen && (
            <span className="min-w-0 flex-1 truncate">{chat.title}</span>
          )}
        </button>

        {isOpen && canManage && (
          <>
            <button
              type="button"
              onClick={() => onTogglePin(chat)}
              className={actionClassName}
              aria-label={isPinned ? "채팅 고정 해제" : "채팅 고정"}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>

            <button
              type="button"
              data-chat-menu-trigger="true"
              onClick={(event) => onOpenMenu(event, chat.key)}
              className={actionClassName}
              aria-label="채팅 메뉴"
            >
              <MoreHorizontal size={17} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

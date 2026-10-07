"use client";

import type { RefObject } from "react";
import {
  Archive,
  ChevronRight,
  Folder,
  Pencil,
  Pin,
  PinOff,
  Share2,
  Trash2,
} from "lucide-react";
import type { SidebarChatItem } from "@/features/chat/lib/chatSidebarItems";

type ChatSessionMenuProps = {
  canManage: boolean;
  isPinned: boolean;
  left: number;
  menuRef: RefObject<HTMLDivElement | null>;
  onDelete: (chat: SidebarChatItem) => void;
  onTogglePin: (chat: SidebarChatItem) => void;
  top: number;
  chat: SidebarChatItem;
};

const itemClassName =
  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white";

export const ChatSessionMenu = ({
  canManage,
  chat,
  isPinned,
  left,
  menuRef,
  onDelete,
  onTogglePin,
  top,
}: ChatSessionMenuProps) => (
  <div
    ref={menuRef}
    className="fixed z-[130] w-[260px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
    style={{ left, top }}
  >
    <button type="button" className={itemClassName}>
      <Share2 size={18} />
      공유하기
    </button>

    <button type="button" className={itemClassName}>
      <Pencil size={18} />
      이름 바꾸기
    </button>

    <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

    <button
      type="button"
      disabled={!canManage}
      onClick={() => onTogglePin(chat)}
      className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
      {isPinned ? "채팅 고정 해제" : "채팅 고정"}
    </button>

    <button type="button" className={itemClassName}>
      <Archive size={18} />
      아카이브에 보관
    </button>

    <button
      type="button"
      disabled={!canManage}
      onClick={() => onDelete(chat)}
      className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-red-500/10"
    >
      <Trash2 size={18} />
      삭제
    </button>

    <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

    <button type="button" className={itemClassName}>
      <Folder size={18} />
      프로젝트로 이동
      <ChevronRight size={17} className="ml-auto text-gray-400" />
    </button>
  </div>
);

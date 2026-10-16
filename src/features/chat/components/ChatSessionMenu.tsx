"use client";

import { type FormEvent, type RefObject, useState } from "react";
import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { SidebarChatItem } from "@/features/chat/lib/chatSidebarItems";

type ChatSessionMenuProps = {
  canManage: boolean;
  isPinned: boolean;
  left: number;
  menuRef: RefObject<HTMLDivElement | null>;
  onDelete: (chat: SidebarChatItem) => void;
  onRename: (chat: SidebarChatItem, title: string) => Promise<boolean>;
  onTogglePin: (chat: SidebarChatItem) => void;
  top: number;
  chat: SidebarChatItem;
};

const itemClassName =
  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white";

export const ChatSessionMenu = ({
  canManage,
  chat,
  isPinned,
  left,
  menuRef,
  onDelete,
  onRename,
  onTogglePin,
  top,
}: ChatSessionMenuProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const [isSaving, setIsSaving] = useState(false);
  const trimmedTitle = title.trim();

  const submitRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle || trimmedTitle === chat.title || isSaving) return;

    setIsSaving(true);
    const didRename = await onRename(chat, trimmedTitle);
    setIsSaving(false);
    if (didRename) setIsRenaming(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[130] w-[260px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
      style={{ left, top }}
    >
      {isRenaming ? (
        <form onSubmit={submitRename} className="space-y-2 p-1">
          <label
            htmlFor="chat-session-title"
            className="block text-xs font-bold text-gray-500 dark:text-gray-400"
          >
            상담 이름
          </label>
          <input
            id="chat-session-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSaving}
            className="focus:border-brand focus:ring-brand/15 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:ring-2 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              disabled={isSaving}
              className="h-9 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={
                !trimmedTitle || trimmedTitle === chat.title || isSaving
              }
              className="bg-brand h-9 rounded-xl text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? "저장 중" : "저장"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          disabled={!canManage}
          onClick={() => setIsRenaming(true)}
          className={itemClassName}
        >
          <Pencil size={18} />
          이름 바꾸기
        </button>
      )}

      <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

      <button
        type="button"
        disabled={!canManage}
        onClick={() => onTogglePin(chat)}
        className={itemClassName}
      >
        {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
        {isPinned ? "채팅 고정 해제" : "채팅 고정"}
      </button>

      <button
        type="button"
        disabled={!canManage}
        onClick={() => onDelete(chat)}
        className={`${itemClassName} text-red-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400`}
      >
        <Trash2 size={18} />
        삭제
      </button>
    </div>
  );
};

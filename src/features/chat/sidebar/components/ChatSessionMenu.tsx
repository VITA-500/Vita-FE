"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useState,
} from "react";
import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { SidebarChatItem } from "@/features/chat/sidebar/lib/chatSidebarItems";

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
const CHAT_SESSION_TITLE_MAX_LENGTH = 30;

const normalizeTitle = (value: string) => value.trim().replace(/\s+/g, " ");

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
  const normalizedTitle = normalizeTitle(title);
  const titleLength = Array.from(normalizedTitle).length;
  const displayTitleLength = Array.from(title).length;
  // 입력 그대로의 길이와 저장될 길이(공백 정리 후)가 다르면 저장될 길이를 함께 알려준다.
  const titleCounterText =
    displayTitleLength === titleLength
      ? `${displayTitleLength}/${CHAT_SESSION_TITLE_MAX_LENGTH}`
      : `${displayTitleLength}/${CHAT_SESSION_TITLE_MAX_LENGTH} · 저장 시 ${titleLength}자`;
  const isTitleInvalid =
    titleLength === 0 || titleLength > CHAT_SESSION_TITLE_MAX_LENGTH;
  const canSave =
    !isTitleInvalid && normalizedTitle !== chat.title && !isSaving;

  const submitRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    const didRename = await onRename(chat, normalizedTitle);
    setIsSaving(false);
    if (didRename) setIsRenaming(false);
  };

  const submitRenameOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[130] w-[260px] max-w-[calc(100vw-24px)] overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
      style={{ left, top }}
    >
      {isRenaming ? (
        <form onSubmit={submitRename} className="min-w-0 space-y-2 p-1">
          <label
            htmlFor="chat-session-title"
            className="block text-xs font-bold text-gray-500 dark:text-gray-400"
          >
            상담 이름
          </label>
          <textarea
            id="chat-session-title"
            autoFocus
            rows={2}
            wrap="soft"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={submitRenameOnEnter}
            disabled={isSaving}
            aria-describedby="chat-session-title-help"
            aria-invalid={titleLength > CHAT_SESSION_TITLE_MAX_LENGTH}
            className="focus:border-brand focus:ring-brand/15 field-sizing-content max-h-28 min-h-16 w-full min-w-0 resize-none overflow-x-hidden overflow-y-auto rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-5 font-semibold break-words text-gray-950 outline-none focus:ring-2 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          />
          <div
            id="chat-session-title-help"
            className="flex items-start justify-between gap-2 text-[11px] font-semibold"
          >
            <span
              className={
                titleLength > CHAT_SESSION_TITLE_MAX_LENGTH
                  ? "text-red-500"
                  : "text-text-secondary"
              }
            >
              {titleLength > CHAT_SESSION_TITLE_MAX_LENGTH
                ? "30자 이내로 입력해 주세요."
                : "공백은 한 칸으로 정리돼요."}
            </span>
            <span
              className={
                titleLength > CHAT_SESSION_TITLE_MAX_LENGTH
                  ? "shrink-0 text-red-500"
                  : "text-text-secondary shrink-0"
              }
            >
              {titleCounterText}
            </span>
          </div>
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
              disabled={!canSave}
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

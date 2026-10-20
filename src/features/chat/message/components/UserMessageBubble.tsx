"use client";

import { ArrowUp, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

type UserMessageBubbleProps = {
  canEdit: boolean;
  content: string;
  showEditHint: boolean;
  onSubmitEdit: (prompt: string) => void;
};

export const UserMessageBubble = ({
  canEdit,
  content,
  onSubmitEdit,
  showEditHint,
}: UserMessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;

    const textarea = textareaRef.current;

    textarea?.focus();
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [isEditing]);

  const isEditOpen = isEditing && canEdit;

  const startEdit = () => {
    setDraft(content);
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const submitEdit = () => {
    const nextPrompt = draft.trim();

    if (!nextPrompt) return;

    setIsEditing(false);
    onSubmitEdit(nextPrompt);
  };

  if (isEditOpen) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitEdit();
        }}
        className="border-brand ml-auto w-full max-w-[72%] rounded-2xl border-2 bg-white p-3 shadow-sm dark:bg-zinc-950"
      >
        <label className="sr-only" htmlFor="chat-edit-prompt">
          질문 수정
        </label>
        <textarea
          id="chat-edit-prompt"
          ref={textareaRef}
          value={draft}
          rows={Math.min(Math.max(draft.split("\n").length, 2), 6)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            }

            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submitEdit();
            }
          }}
          className="text-text-primary w-full resize-none bg-transparent px-1 text-sm leading-6 outline-none dark:text-white"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            className="text-text-secondary hover:bg-surface-muted rounded-full px-3 py-1.5 text-xs font-bold transition dark:text-gray-300 dark:hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="submit"
            aria-label="다시 보내기"
            title="다시 보내기"
            disabled={!draft.trim()}
            className="bg-brand hover:bg-brand-hover flex h-8 w-8 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="ml-auto flex max-w-[72%] flex-col items-end gap-1.5">
      <article className="border-brand/40 bg-brand min-w-0 rounded-2xl border px-5 py-3 text-sm leading-6 text-white shadow-sm">
        <p className="whitespace-pre-line">{content}</p>
      </article>

      {canEdit && (
        <div className="group relative">
          <button
            type="button"
            aria-label="질문 수정"
            onClick={startEdit}
            className="text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:ring-brand flex h-8 w-8 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Pencil size={15} />
          </button>
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white shadow-lg transition-opacity duration-200",
              "after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-900",
              showEditHint
                ? "opacity-100"
                : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            질문 수정
          </span>
        </div>
      )}
    </div>
  );
};

import { ArrowUp, Mic, Plus, Square } from "lucide-react";
import type { RefObject } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ChatQuickActionMenu,
  getVisibleQuickActions,
} from "@/features/chat/components/ChatQuickActionMenu";
import { useChatClientSettings } from "@/features/chat/hooks/useChatClientSettings";
import { usePointerDownOutside } from "@/shared/hooks/usePointerDownOutside";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** 답변을 받는 중일 때 보내기 버튼 대신 중단 버튼을 보여준다. */
  onStop?: () => void;
  onSelectQuickAction?: (prompt: string) => void;
  isLoading?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
};

export const ChatComposer = ({
  inputRef,
  isLoading = false,
  onChange,
  onSelectQuickAction,
  onStop,
  onSubmit,
  value,
}: ChatComposerProps) => {
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const composerRef = useRef<HTMLFormElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const { settings } = useChatClientSettings();
  const quickActions = getVisibleQuickActions(settings.quickActionIds);

  useLayoutEffect(() => {
    const input = composerRef.current?.querySelector("textarea");
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [inputRef, value]);

  usePointerDownOutside({
    enabled: isQuickActionOpen,
    onPointerDownOutside: () => setIsQuickActionOpen(false),
    ref: quickActionRef,
  });

  return (
    <form
      ref={composerRef}
      id="vita-chat-input-tour"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="border-border mx-auto flex min-h-14 w-full items-end gap-2.5 rounded-2xl border bg-white py-2 pr-3 pl-3 shadow-sm dark:border-white/10 dark:bg-zinc-950"
    >
      <div ref={quickActionRef} className="relative shrink-0">
        {isQuickActionOpen && onSelectQuickAction && (
          <ChatQuickActionMenu
            actions={quickActions}
            onSelectAction={(prompt) => {
              setIsQuickActionOpen(false);
              onSelectQuickAction(prompt);
            }}
          />
        )}

        <button
          id="vita-quick-action-tour"
          type="button"
          aria-label="빠른 작업"
          aria-expanded={isQuickActionOpen}
          onClick={() => setIsQuickActionOpen((current) => !current)}
          className="text-text-secondary hover:bg-surface-muted hover:text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        placeholder="VITA에게 물어보세요"
        className="text-text-primary max-h-32 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm leading-5 font-normal outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-white"
      />

      <button
        id="vita-voice-input-tour"
        type="button"
        aria-label="음성 입력"
        title="음성 입력은 후속 작업에서 연결할 예정입니다."
        className="text-text-secondary hover:bg-surface-muted hover:text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Mic size={18} />
      </button>

      {isLoading && onStop ? (
        <button
          type="button"
          aria-label="답변 중단"
          title="답변 중단"
          onClick={onStop}
          className="text-text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 transition hover:bg-gray-700 active:scale-95 dark:bg-white dark:hover:bg-gray-200"
        >
          <Square
            size={13}
            className="fill-white text-white dark:fill-gray-900 dark:text-gray-900"
          />
        </button>
      ) : (
        <button
          type="submit"
          aria-label="메시지 보내기"
          disabled={isLoading || !value.trim()}
          className="bg-brand hover:bg-brand-hover flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      )}
    </form>
  );
};

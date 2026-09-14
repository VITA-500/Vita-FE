import { ArrowUp, Mic, Plus } from "lucide-react";
import type { RefObject } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
};

export const ChatComposer = ({
  inputRef,
  isLoading = false,
  onChange,
  onSubmit,
  value,
}: ChatComposerProps) => (
  <form
    id="vita-chat-input-tour"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
    className="border-border mx-auto flex h-14 w-full items-center gap-2.5 rounded-2xl border bg-white py-2 pr-3 pl-3 shadow-sm dark:border-white/10 dark:bg-zinc-950"
  >
    <button
      type="button"
      aria-label="첨부"
      className="text-text-secondary hover:bg-surface-muted hover:text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Plus size={20} />
    </button>

    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="VITA에게 물어보세요"
      className="text-text-primary min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-white"
    />

    <button
      type="button"
      aria-label="음성 입력"
      className="text-text-secondary hover:bg-surface-muted hover:text-text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Mic size={18} />
    </button>

    <button
      type="submit"
      aria-label="메시지 보내기"
      disabled={isLoading || !value.trim()}
      className="bg-brand hover:bg-brand-hover flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  </form>
);

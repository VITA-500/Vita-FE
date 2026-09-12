import { ArrowUp, Mic, Plus } from "lucide-react";

export const ChatComposer = () => (
  <form
    id="vita-chat-input-tour"
    onSubmit={(event) => event.preventDefault()}
    className="mx-auto flex h-14 w-full items-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-2 pl-3 pr-3 shadow-[0_14px_44px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950"
  >
    <button
      type="button"
      aria-label="첨부"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Plus size={20} />
    </button>

    <input
      type="text"
      placeholder="VITA에게 물어보세요"
      className="min-w-0 flex-1 bg-transparent text-sm font-normal text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-white"
    />

    <button
      type="button"
      aria-label="음성 입력"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Mic size={18} />
    </button>

    <button
      type="submit"
      aria-label="메시지 보내기"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover active:scale-95"
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  </form>
);

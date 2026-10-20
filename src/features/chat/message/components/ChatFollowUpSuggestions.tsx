import { CornerDownRight } from "lucide-react";
import type { ChatFollowUp } from "@/features/chat/message/lib/chatFollowUps";

type ChatFollowUpSuggestionsProps = {
  followUp: ChatFollowUp;
  onSelectPrompt: (prompt: string) => void;
};

/** 마지막 답변 아래에 붙는 후속 제안. 누르면 그 문장을 바로 질문으로 보낸다. */
export const ChatFollowUpSuggestions = ({
  followUp,
  onSelectPrompt,
}: ChatFollowUpSuggestionsProps) => (
  <section aria-label="이어서 물어볼 만한 질문" className="mt-3 px-1">
    <p className="text-text-secondary text-xs leading-5 font-medium dark:text-gray-400">
      {followUp.intro}
    </p>
    <div className="mt-2 flex flex-wrap gap-2">
      {followUp.prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelectPrompt(prompt)}
          className="border-border text-text-primary hover:border-brand/50 hover:bg-surface-brand-hover inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color] duration-150 dark:border-white/15 dark:bg-zinc-950 dark:text-white"
        >
          <CornerDownRight
            size={12}
            aria-hidden="true"
            className="text-brand shrink-0"
          />
          {prompt}
        </button>
      ))}
    </div>
  </section>
);

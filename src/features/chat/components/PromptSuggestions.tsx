import { ChevronRight } from "lucide-react";
import { suggestedPrompts } from "@/features/chat/constants";

type PromptSuggestionsProps = {
  onSelectPrompt: (prompt: string) => void;
};

export const PromptSuggestions = ({
  onSelectPrompt,
}: PromptSuggestionsProps) => (
  <div className="mx-auto mt-10 w-full max-w-[760px]">
    <p className="text-text-secondary mb-5 text-xs font-medium dark:text-gray-400">
      이런 질문으로 시작해보세요
    </p>

    <div id="vita-suggestion-tour" className="space-y-4">
      {suggestedPrompts.map((prompt) => (
        <button
          key={prompt.title}
          type="button"
          onClick={() => onSelectPrompt(prompt.prompt)}
          className="group border-border hover:border-brand/50 hover:bg-surface-brand-hover dark:hover:bg-surface-brand-hover flex w-full items-center justify-between gap-4 rounded-2xl border bg-white px-6 py-5 text-left transition-[background-color,border-color,box-shadow] duration-150 hover:shadow-sm dark:border-white/10 dark:bg-zinc-950"
        >
          <span className="min-w-0">
            <span className="text-text-primary block text-sm font-bold dark:text-white">
              {prompt.title}
            </span>

            <span className="text-text-secondary mt-1.5 block text-xs leading-5 font-normal dark:text-gray-400">
              {prompt.description}
            </span>
          </span>

          <ChevronRight
            size={18}
            className="group-hover:text-brand shrink-0 text-gray-400 transition duration-150 group-hover:translate-x-0.5"
          />
        </button>
      ))}
    </div>
  </div>
);

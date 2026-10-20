import type { ChatClarifyChoices as ChatClarifyChoicesData } from "@/features/chat/message/lib/chatClarifyChoices";

type ChatClarifyChoicesProps = {
  clarify: ChatClarifyChoicesData;
  onSelectChoice: (choice: string) => void;
};

/** 챗봇이 되물은 질문의 선택지 버튼. 누르면 항목 글자를 그대로 질문으로 보낸다. */
export const ChatClarifyChoices = ({
  clarify,
  onSelectChoice,
}: ChatClarifyChoicesProps) => (
  <div role="group" aria-label="답변을 이어갈 선택지" className="mt-3">
    <div className="flex flex-wrap gap-2">
      {clarify.choices.map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => onSelectChoice(choice)}
          className="border-brand/40 text-brand-hover hover:bg-brand-soft dark:border-brand/50 dark:text-brand rounded-full border bg-white px-3.5 py-1.5 text-xs font-bold transition-colors duration-150 dark:bg-zinc-950 dark:hover:bg-white/10"
        >
          {choice}
        </button>
      ))}
    </div>
    {clarify.hasOtherOption && (
      <p className="text-text-secondary mt-2 text-xs dark:text-gray-400">
        그 밖의 내용은 아래 입력창에 적어 주세요.
      </p>
    )}
  </div>
);

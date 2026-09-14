import type { ChatMessage } from "@/features/chat/types";
import { ButtonLink } from "@/shared/ui/Button";

type ChatMessageListProps = {
  isLoading: boolean;
  messages: ChatMessage[];
};

const AssistantProfile = () => (
  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white shadow-sm shadow-brand/20">
    V
  </div>
);

export const ChatMessageList = ({
  isLoading,
  messages,
}: ChatMessageListProps) => (
  <div className="mx-auto flex w-full flex-col gap-5">
    {messages.map((message) => {
      const isUser = message.role === "user";

      if (isUser) {
        return (
          <article
            key={message.id}
            className="ml-auto max-w-[72%] rounded-2xl border border-brand/40 bg-brand px-5 py-3 text-sm leading-6 text-white shadow-sm"
          >
            <p className="whitespace-pre-line">{message.content}</p>
          </article>
        );
      }

      return (
        <div
          key={message.id}
          className="mr-auto flex max-w-[76%] items-start gap-3"
        >
          <AssistantProfile />

          <div className="min-w-0 flex-1">
            <article className="rounded-3xl border border-border bg-white px-5 py-4 text-sm leading-6 text-text-primary shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-white">
              <p className="whitespace-pre-line">{message.content}</p>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-3 dark:border-white/10">
                  <p className="text-xs font-extrabold text-brand">
                    참고한 FAQ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <span
                        key={source.id}
                        className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-text-secondary dark:bg-white/10 dark:text-gray-300"
                      >
                        {source.category} · {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.actions && message.actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.actions.map((action) => (
                    <ButtonLink
                      key={action.href}
                      href={action.href}
                      size="sm"
                      className="rounded-full"
                    >
                      {action.label}
                    </ButtonLink>
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
      );
    })}

    {isLoading && (
      <div
        aria-label="답변을 정리하고 있어요"
        className="mr-auto flex max-w-[76%] items-start gap-3 text-sm font-medium text-text-secondary dark:text-gray-400"
      >
        <AssistantProfile />

        <div className="pt-3">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">생각 중</span>
            <span className="flex items-center gap-1 pt-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:240ms]" />
            </span>
          </div>
        </div>
      </div>
    )}
  </div>
);

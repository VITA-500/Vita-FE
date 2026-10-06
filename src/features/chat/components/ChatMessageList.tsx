import Image from "next/image";
import { ChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { ChatProgressSteps } from "@/features/chat/components/ChatProgressSteps";
import { ChatStoreMap } from "@/features/chat/components/ChatStoreMap";
import type { ChatMessage, ChatStreamingReply } from "@/features/chat/types";
import { ButtonLink } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

const ASSISTANT_PROFILE_IMAGE = "/images/chatbot/profile-robot.png";

type ChatMessageListProps = {
  isLoading: boolean;
  messages: ChatMessage[];
  /** SSE로 받고 있는 답변. 글자가 오기 시작하면 진행 단계 대신 답변 말풍선을 바로 보여준다. */
  streamingReply?: ChatStreamingReply | null;
};

const AssistantProfile = () => (
  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fffbdc]">
    <Image
      src={ASSISTANT_PROFILE_IMAGE}
      alt="VITA 상담사"
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
    />
  </span>
);

/** 덜 온 굵게(**)·코드(`) 표시가 기호 그대로 보이지 않도록 마지막 줄의 짝을 맞춰 준다. */
const closeOpenInlineMarks = (content: string) => {
  const lastLine = content.slice(content.lastIndexOf("\n") + 1);
  const boldCount = lastLine.match(/\*\*/g)?.length ?? 0;
  const codeCount = lastLine.match(/`/g)?.length ?? 0;
  let closed = content;

  if (codeCount % 2 === 1) closed += "`";
  if (boldCount % 2 === 1) closed += "**";

  return closed;
};

/** 목록·표·카드를 받는 동안 말풍선 안에 보여주는 자리 표시 블록 */
const PreparingBlock = () => (
  <div
    role="status"
    aria-label="내용을 정리하고 있어요"
    className="border-border bg-surface-muted/60 mt-3 space-y-2.5 rounded-2xl border p-4 first:mt-0 dark:border-white/10 dark:bg-white/5"
  >
    <span className="block h-3 w-1/3 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
    <span className="block h-3 w-11/12 animate-pulse rounded-full bg-gray-200 [animation-delay:120ms] dark:bg-white/10" />
    <span className="block h-3 w-4/5 animate-pulse rounded-full bg-gray-200 [animation-delay:240ms] dark:bg-white/10" />
  </div>
);

/**
 * 스트리밍 중인 답변. 글은 한 글자씩 늘어나고, 목록·표·카드는 받는 동안 로딩 블록을 보여주다가
 * 완성되면 통째로 나타난다(chat-stream-blocks: 새로 붙는 블록만 페이드인).
 */
const StreamingAnswer = ({ reply }: { reply: ChatStreamingReply }) => (
  <>
    {reply.content.trim() && (
      <ChatMarkdown
        content={closeOpenInlineMarks(reply.content)}
        className="chat-stream-blocks"
      />
    )}
    {reply.isPreparingBlock && <PreparingBlock />}
  </>
);

export const ChatMessageList = ({
  isLoading,
  messages,
  streamingReply,
}: ChatMessageListProps) => (
  <div className="mx-auto flex w-full flex-col gap-5">
    {messages.map((message) => {
      const isUser = message.role === "user";

      if (isUser) {
        return (
          <article
            key={message.id}
            className="border-brand/40 bg-brand ml-auto max-w-[72%] rounded-2xl border px-5 py-3 text-sm leading-6 text-white shadow-sm"
          >
            <p className="whitespace-pre-line">{message.content}</p>
          </article>
        );
      }

      return (
        <div
          key={message.id}
          className={cn(
            "mr-auto flex max-w-full items-start gap-2 md:gap-3",
            message.storeMap ? "md:max-w-[92%]" : "md:max-w-[76%]",
          )}
        >
          <AssistantProfile />

          <div className="min-w-0 flex-1">
            <article className="border-border text-text-primary rounded-3xl border bg-white px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-white/10 dark:bg-zinc-950 dark:text-white">
              <ChatMarkdown content={message.content ?? ""} />

              {message.storeMap && <ChatStoreMap storeMap={message.storeMap} />}

              {/* 참고한 FAQ 표시는 사용하지 않기로 해서 숨김 처리 (BE relatedFaqs 미요청).
                  다시 표시하려면 아래 블록의 주석을 해제하세요.
              {message.sources && message.sources.length > 0 && (
                <div className="border-border mt-4 space-y-2 border-t pt-3 dark:border-white/10">
                  <p className="text-brand text-xs font-extrabold">
                    참고한 FAQ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <span
                        key={source.id}
                        className="bg-surface-muted text-text-secondary rounded-full px-3 py-1 text-xs font-bold dark:bg-white/10 dark:text-gray-300"
                      >
                        {source.category} · {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              */}

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

    {isLoading &&
      streamingReply &&
      (streamingReply.content || streamingReply.isPreparingBlock) && (
        <div
          aria-busy="true"
          className="mr-auto flex max-w-full items-start gap-2 md:max-w-[76%] md:gap-3"
        >
          <AssistantProfile />

          <div className="min-w-0 flex-1">
            <article className="border-border text-text-primary rounded-3xl border bg-white px-4 py-4 text-sm leading-6 shadow-sm md:px-5 dark:border-white/10 dark:bg-zinc-950 dark:text-white">
              <StreamingAnswer reply={streamingReply} />
            </article>
          </div>
        </div>
      )}

    {isLoading &&
      !streamingReply?.content &&
      !streamingReply?.isPreparingBlock && (
        <div
          aria-label="답변을 준비하고 있어요"
          className="mr-auto flex max-w-[76%] items-start gap-3"
        >
          <AssistantProfile />

          <div className="min-w-0">
            <ChatProgressSteps stage={streamingReply?.stage} />

            {/* 기존 로딩 표시: 단계 아래에서 계속 움직여 응답을 기다리는 중임을 보여준다. */}
            <div
              aria-hidden="true"
              className="text-text-secondary mt-3 flex items-center gap-2 pl-7 text-sm font-medium dark:text-gray-400"
            >
              <span className="animate-pulse">생각 중</span>
              <span className="flex items-center gap-1 pt-1">
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:120ms]" />
                <span className="bg-brand h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        </div>
      )}
  </div>
);

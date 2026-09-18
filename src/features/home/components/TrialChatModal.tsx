import type { FormEvent, RefObject } from "react";
import { useEffect, useRef } from "react";
import { ArrowRight, ChevronRight, LockKeyhole, X } from "lucide-react";
import { uiText } from "@/shared/constants/uiText";
import type { TrialMessage } from "@/features/home/hooks/useTrialChat";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Logo } from "@/shared/ui/Logo";

type TrialChatModalProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  isLimitReached: boolean;
  messages: TrialMessage[];
  question: string;
  remainingCount: number;
  onClose: () => void;
  onQuestionChange: (question: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const TrialChatModal = ({
  inputRef,
  isLimitReached,
  messages,
  onClose,
  onQuestionChange,
  onSubmit,
  question,
  remainingCount,
}: TrialChatModalProps) => {
  const preview = uiText.home.preview;
  const trial = uiText.home.trial;
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const messageList = messageListRef.current;

    if (!messageList) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length, isLimitReached]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-chat-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="border-border flex max-h-[calc(100svh-48px)] w-full max-w-[640px] flex-col rounded-3xl border bg-white p-4 shadow-[0_22px_70px_rgba(25,31,40,0.22)] dark:border-white/10 dark:bg-zinc-950">
        <div className="bg-app-bg flex items-center justify-between rounded-3xl p-4 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <Logo href="" heightClassName="h-9" alt="VITA 로고" />
            <div>
              <p className="text-base font-extrabold text-gray-950 dark:text-white">
                {preview.activeMenu}
              </p>
              <p className="mt-1 text-xs font-bold text-gray-400">
                {preview.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:text-gray-950 dark:bg-zinc-900 dark:text-gray-400 dark:hover:text-white"
            aria-label="상담 창 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-3xl bg-white p-4 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                id="trial-chat-title"
                className="text-2xl leading-tight font-extrabold text-gray-950 dark:text-white"
              >
                {isLimitReached ? trial.limitTitle : preview.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {isLimitReached ? trial.limitDescription : preview.description}
              </p>
            </div>

            <span className="bg-brand-soft text-brand w-fit shrink-0 rounded-full px-4 py-2 text-xs font-bold">
              {trial.remainingLabel.replace("{count}", String(remainingCount))}
            </span>
          </div>

          <div
            ref={messageListRef}
            className="mt-5 flex h-[260px] [scrollbar-gutter:stable] flex-col gap-3 overflow-y-scroll rounded-2xl bg-gray-50 p-4 [overflow-anchor:none] dark:bg-white/5"
          >
            {messages.length === 0 ? (
              <button
                type="button"
                onClick={() => onQuestionChange(preview.suggestionTitle)}
                className="hover:bg-brand-soft flex w-full items-center justify-between rounded-2xl bg-white p-5 text-left transition dark:bg-zinc-900 dark:hover:bg-white/10"
              >
                <span>
                  <span className="block text-sm font-bold text-gray-950 dark:text-white">
                    {preview.suggestionTitle}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                    {preview.suggestionText}
                  </span>
                </span>
                <ChevronRight className="shrink-0 text-gray-400" size={22} />
              </button>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content}`}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 font-medium ${
                    message.role === "user"
                      ? "bg-brand ml-auto text-white"
                      : "mr-auto bg-white text-gray-700 shadow-sm dark:bg-zinc-900 dark:text-gray-200"
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}

            {isLimitReached && (
              <div className="border-brand/20 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
                <div className="flex items-start gap-4">
                  <span className="bg-brand-soft text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <LockKeyhole size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-gray-950 dark:text-white">
                      {trial.loginPromptTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {trial.loginPromptDescription}
                    </p>
                  </div>
                </div>

                <ButtonLink
                  href={routes.login}
                  size="md"
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
                >
                  {trial.loginButton}
                  <ArrowRight size={17} />
                </ButtonLink>
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="border-border mt-4 flex h-14 shrink-0 items-center gap-3 rounded-2xl border bg-white px-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <input
              ref={inputRef}
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              disabled={isLimitReached}
              placeholder={isLimitReached ? trial.limitInput : preview.input}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-white"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLimitReached}
              className="bg-brand hover:bg-brand-hover flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="상담 보내기"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

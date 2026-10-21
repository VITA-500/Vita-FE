import { ArrowDown } from "lucide-react";
import { useId } from "react";
import { cn } from "@/shared/lib/cn";

type ChatLatestScrollButtonProps = {
  isLoading?: boolean;
  isVisible: boolean;
  onClick: () => void;
};

export const ChatLatestScrollButton = ({
  isLoading = false,
  isVisible,
  onClick,
}: ChatLatestScrollButtonProps) => (
  <ChatLatestScrollButtonButton
    isLoading={isLoading}
    isVisible={isVisible}
    onClick={onClick}
  />
);

const ChatLatestScrollButtonButton = ({
  isLoading,
  isVisible,
  onClick,
}: ChatLatestScrollButtonProps) => {
  const clipPathId = useId();

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      className={cn(
        "border-border bg-surface-warm/95 text-text-secondary hover:text-text-primary pointer-events-auto absolute bottom-28 left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-[opacity,transform,background-color] duration-300 dark:border-white/10 dark:bg-zinc-950/95 dark:text-gray-300 dark:hover:text-white",
        isVisible
          ? "scale-100 opacity-100 hover:-translate-y-0.5"
          : "pointer-events-none scale-75 opacity-0",
      )}
      aria-label={isLoading ? "최신 답변 보기" : "최신 대화 보기"}
      title={isLoading ? "최신 답변 보기" : "최신 대화 보기"}
    >
      {isLoading ? (
        <span className="chat-latest-loading" aria-hidden="true">
          <svg
            className="chat-latest-loading__droplet"
            viewBox="0 0 24 30"
            role="presentation"
          >
            <defs>
              <clipPath id={clipPathId}>
                <path d="M12 1C10.4 5.1 4 10.6 4 17.2A8 8 0 0 0 20 17.2C20 10.6 13.6 5.1 12 1Z" />
              </clipPath>
            </defs>
            <path
              className="chat-latest-loading__droplet-base"
              d="M12 1C10.4 5.1 4 10.6 4 17.2A8 8 0 0 0 20 17.2C20 10.6 13.6 5.1 12 1Z"
            />
            <g clipPath={`url(#${clipPathId})`}>
              <path
                className="chat-latest-loading__droplet-fill"
                d="M-8 17C-2 13 4 19 10 15S22 19 30 14V30H-8Z"
              />
              <path
                className="chat-latest-loading__droplet-wave"
                d="M-8 19C-2 15 4 21 10 17S22 21 30 16V30H-8Z"
              />
              <path
                className="chat-latest-loading__droplet-wave chat-latest-loading__droplet-wave--rear"
                d="M-8 21C-2 18 4 22 10 19S22 23 30 18V30H-8Z"
              />
            </g>
          </svg>
        </span>
      ) : (
        <ArrowDown size={18} aria-hidden="true" />
      )}
    </button>
  );
};

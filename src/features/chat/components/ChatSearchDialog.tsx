"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { recentChats } from "@/features/chat/constants";
import { cn } from "@/shared/lib/cn";

type ChatSearchDialogProps = {
  currentChatTitle?: string;
  isOpen: boolean;
  onClose: () => void;
};

const searchTabs = ["전체", "채팅", "매장", "문서"] as const;

const getSearchPreview = (title: string) =>
  `통신 상담 기록에서 "${title}"와 관련된 안내 내용을 확인해보세요.`;

const getSearchDate = (index: number) =>
  ["9월 11일", "9월 10일", "8월 10일", "8월 13일"][index % 4];

export const ChatSearchDialog = ({
  currentChatTitle,
  isOpen,
  onClose,
}: ChatSearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchItems = useMemo(
    () =>
      [
        ...(currentChatTitle ? [{ title: currentChatTitle }] : []),
        ...recentChats.filter((chat) => chat.title !== currentChatTitle),
      ].map((chat, index) => ({
        date: getSearchDate(index),
        preview: getSearchPreview(chat.title),
        title: chat.title,
      })),
    [currentChatTitle],
  );
  const filteredItems = searchItems.filter((item) =>
    `${item.title} ${item.preview}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setQuery("");
      inputRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center bg-gray-950/35 px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="상담 검색"
      onMouseDown={onClose}
    >
      <div
        className="flex h-[min(580px,76vh)] w-full max-w-[760px] flex-col rounded-3xl border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-zinc-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색..."
            className="min-w-0 flex-1 bg-transparent text-xl font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />

          <div className="relative flex shrink-0 items-center">
            {query && (
              <>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="h-9 rounded-lg px-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  지우기
                </button>

                <span className="mr-4 ml-4 h-5 w-px bg-gray-200 dark:bg-white/10" />
              </>
            )}

            <span className="relative flex h-9 w-9 items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                onMouseEnter={() => setIsCloseTooltipVisible(true)}
                onMouseLeave={() => setIsCloseTooltipVisible(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="검색 닫기"
              >
                <X size={20} />
              </button>

              {isCloseTooltipVisible && (
                <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full bg-gray-950 px-3 py-2 text-sm font-extrabold whitespace-nowrap text-white shadow-xl dark:bg-zinc-950">
                  검색 닫기
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 pb-3">
          {searchTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                "h-10 rounded-full px-4 text-sm font-bold transition",
                tab === "전체"
                  ? "bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-b-3xl px-4 pb-5">
          {!query && (
            <div className="mb-2 px-3">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                최근 대화
              </p>
            </div>
          )}

          <div className="space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition",
                    "text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10",
                  )}
                >
                  <MessageCircle
                    size={22}
                    strokeWidth={1.8}
                    className="shrink-0 text-gray-500 dark:text-gray-200"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-gray-950 dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 block truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.preview}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-300">
                    {item.date}
                  </span>
                </button>
              ))
            ) : (
              <div className="flex min-h-[360px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Search size={22} strokeWidth={1.8} />
                <span className="text-base font-medium">
                  검색 결과가 없습니다
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

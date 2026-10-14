"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { formatSessionTitle } from "@/features/chat/lib/chatSidebarItems";
import type { ChatSessionSummary } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

type ChatSearchDialogProps = {
  chatSessions: readonly ChatSessionSummary[];
  currentChatTitle?: string;
  currentSessionId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (sessionId: number) => void;
};

const searchTabs = ["전체", "채팅"] as const;
type SearchTab = (typeof searchTabs)[number];
const RECENT_SEARCHES_STORAGE_KEY = "vita-chat-recent-searches";
const MAX_RECENT_SEARCHES = 6;

const getSearchPreview = (title: string) =>
  `통신 상담 기록에서 "${title}"와 관련된 안내 내용을 확인해보세요.`;

const formatSearchDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일`;
};

const loadRecentSearches = () => {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(
      window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) ?? "[]",
    ) as unknown;

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const saveRecentSearches = (searches: readonly string[]) => {
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(searches),
  );
};

const addRecentSearch = (
  searches: readonly string[],
  query: string,
): string[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return [...searches];

  return [
    trimmedQuery,
    ...searches.filter((search) => search !== trimmedQuery),
  ].slice(0, MAX_RECENT_SEARCHES);
};

const highlightText = (text: string, query: string): ReactNode => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return text;

  const normalizedText = text.toLowerCase();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }

    const nextCursor = matchIndex + trimmedQuery.length;

    parts.push(
      <mark
        key={`${matchIndex}-${nextCursor}`}
        className="bg-brand-soft text-brand font-inherit rounded px-0.5"
      >
        {text.slice(matchIndex, nextCursor)}
      </mark>,
    );
    cursor = nextCursor;
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

export const ChatSearchDialog = ({
  chatSessions,
  currentChatTitle,
  currentSessionId = null,
  isOpen,
  onClose,
  onSelectChat,
}: ChatSearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("전체");
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [recentSearches, setRecentSearches] =
    useState<string[]>(loadRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchItems = useMemo(
    () =>
      [
        ...(currentChatTitle
          ? [
              {
                date: "",
                preview: "현재 열려 있는 상담입니다.",
                sessionId: currentSessionId,
                title: currentChatTitle,
                type: "채팅" as const,
              },
            ]
          : []),
        ...chatSessions
          .filter((session) => session.sessionId !== currentSessionId)
          .map((session) => {
            const title = formatSessionTitle(session);

            return {
              date: formatSearchDate(session.updatedAt),
              preview: getSearchPreview(title),
              sessionId: session.sessionId,
              title,
              type: "채팅" as const,
            };
          }),
      ].map((item) => ({
        ...item,
        key: `${item.type}-${item.sessionId ?? item.title}`,
      })),
    [chatSessions, currentChatTitle, currentSessionId],
  );
  const filteredItems = searchItems
    .filter((item) => activeTab === "전체" || item.type === activeTab)
    .filter((item) =>
      `${item.title} ${item.preview}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
  const commitRecentSearch = () => {
    setRecentSearches((searches) => {
      const nextSearches = addRecentSearch(searches, query);

      saveRecentSearches(nextSearches);
      return nextSearches;
    });
  };
  const removeRecentSearch = (target: string) => {
    setRecentSearches((searches) => {
      const nextSearches = searches.filter((search) => search !== target);

      saveRecentSearches(nextSearches);
      return nextSearches;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setActiveTab("전체");
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
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-bold transition",
                tab === activeTab
                  ? "bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-b-3xl px-4 pb-5">
          {!query && recentSearches.length > 0 && (
            <div className="mb-5 px-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  최근 검색어
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    saveRecentSearches([]);
                  }}
                  className="text-xs font-bold text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
                >
                  모두 지우기
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <span
                    key={search}
                    className="flex max-w-full items-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 dark:bg-white/10 dark:text-gray-200"
                  >
                    <button
                      type="button"
                      onClick={() => setQuery(search)}
                      className="min-w-0 truncate px-3 py-2"
                    >
                      {search}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecentSearch(search)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:text-gray-800 dark:hover:text-white"
                      aria-label={`${search} 검색어 삭제`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
                  key={item.key}
                  type="button"
                  disabled={item.sessionId === null}
                  onClick={() => {
                    if (item.sessionId !== null) {
                      commitRecentSearch();
                      onSelectChat(item.sessionId);
                    }

                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition",
                    item.sessionId === null
                      ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
                      : "text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10",
                  )}
                >
                  <MessageCircle
                    size={22}
                    strokeWidth={1.8}
                    className="shrink-0 text-gray-500 dark:text-gray-200"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-gray-950 dark:text-white">
                      {highlightText(item.title, query)}
                    </span>
                    <span className="mt-1 block truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {highlightText(item.preview, query)}
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

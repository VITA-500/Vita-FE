import { formatSessionTitle } from "@/features/chat/sidebar/lib/chatSidebarItems";
import type { ChatSessionSummary } from "@/features/chat/types";

const STORAGE_KEY = "vita-chat-recent-searches";

export const searchPeriodOptions = [
  { label: "전체 기간", value: "all" },
  { label: "오늘", value: "today" },
  { label: "최근 7일", value: "week" },
  { label: "최근 30일", value: "month" },
  { label: "특정 날짜", value: "date" },
  { label: "기간 직접 선택", value: "range" },
] as const;
export type SearchPeriod = (typeof searchPeriodOptions)[number]["value"];
export type SearchPeriodSelection = {
  period: SearchPeriod;
  selectedDate: string;
  startDate: string;
  endDate: string;
};
export const emptySearchPeriod: SearchPeriodSelection = {
  period: "all",
  selectedDate: "",
  startDate: "",
  endDate: "",
};

export const getSearchPeriodRange = (
  period: SearchPeriod,
  selectedDate: string,
  start: string,
  end: string,
  now = new Date(),
): [string, string] => {
  if (period === "all") return ["", ""];
  if (period === "date") return [selectedDate, selectedDate];
  if (period === "range") return [start, end];
  const firstDay = new Date(now);
  firstDay.setDate(
    firstDay.getDate() - (period === "week" ? 6 : period === "month" ? 29 : 0),
  );
  return [
    toSearchDate(firstDay.toISOString()),
    toSearchDate(now.toISOString()),
  ];
};

/** 날짜 입력과 같은 브라우저 현지 날짜로 비교한다. UTC 변환은 하지 않는다. */
export const toSearchDate = (value: string) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const matchesSearchDates = (date: string, start: string, end: string) =>
  (!start && !end) ||
  Boolean(date && (!start || date >= start) && (!end || date <= end));

export const buildChatSearchItems = (
  sessions: readonly ChatSessionSummary[],
  currentTitle?: string,
  currentId: number | null = null,
) => {
  const items = sessions.map((session) => ({
    date: toSearchDate(session.updatedAt),
    preview:
      session.sessionId === currentId
        ? "현재 열려 있는 상담입니다."
        : "상담을 열어 이전에 나눈 대화를 확인해보세요.",
    sessionId: session.sessionId as number | null,
    title:
      session.sessionId === currentId && currentTitle
        ? currentTitle
        : formatSessionTitle(session),
    type: "채팅" as const,
  }));
  const currentIndex = items.findIndex((item) => item.sessionId === currentId);
  if (currentIndex > 0) items.unshift(...items.splice(currentIndex, 1));
  if (
    currentTitle &&
    !sessions.some((session) => session.sessionId === currentId)
  ) {
    items.unshift({
      date: "",
      preview: "현재 열려 있는 상담입니다.",
      sessionId: currentId,
      title: currentTitle,
      type: "채팅",
    });
  }
  return items.map((item) => ({
    ...item,
    key: `chat-${item.sessionId ?? item.title}`,
  }));
};

export const loadRecentSearches = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .slice(0, 6)
      : [];
  } catch {
    return [];
  }
};

export const saveRecentSearches = (searches: readonly string[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
};

export const addRecentSearch = (searches: readonly string[], query: string) =>
  query.trim()
    ? [
        query.trim(),
        ...searches.filter((search) => search !== query.trim()),
      ].slice(0, 6)
    : [...searches];

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readJsonStorage,
  readStorage,
  writeJsonStorage,
  writeStorage,
} from "@/shared/lib/browserStorage";

const HISTORY_STORAGE_KEY = "vita-store-search-history";
const HISTORY_ENABLED_STORAGE_KEY = "vita-store-search-history-enabled";
const MAX_HISTORY_COUNT = 8;

export type StoreSearchHistoryItem = {
  query: string;
  storeId?: string;
  searchedAt: number;
};

const readHistory = (): StoreSearchHistoryItem[] => {
  const parsed = readJsonStorage("local", HISTORY_STORAGE_KEY);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(
      (item): item is StoreSearchHistoryItem =>
        typeof item?.query === "string" && item.query.trim().length > 0,
    )
    .slice(0, MAX_HISTORY_COUNT);
};

const readEnabled = () =>
  readStorage("local", HISTORY_ENABLED_STORAGE_KEY) !== "false";

/** 매장 검색 히스토리(최근 검색어)와 저장 on/off 설정을 브라우저에 보관한다. */
export const useStoreSearchHistory = () => {
  const [history, setHistory] = useState<StoreSearchHistoryItem[]>([]);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHistory(readHistory());
      setIsHistoryEnabled(readEnabled());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const addHistory = useCallback(
    (query: string, storeId?: string) => {
      const trimmedQuery = query.trim();

      if (!isHistoryEnabled || !trimmedQuery) {
        return;
      }

      setHistory((prevHistory) => {
        const nextHistory = [
          { query: trimmedQuery, storeId, searchedAt: Date.now() },
          ...prevHistory.filter((item) => item.query !== trimmedQuery),
        ].slice(0, MAX_HISTORY_COUNT);

        writeJsonStorage("local", HISTORY_STORAGE_KEY, nextHistory);

        return nextHistory;
      });
    },
    [isHistoryEnabled],
  );

  const removeHistory = useCallback((query: string) => {
    setHistory((prevHistory) => {
      const nextHistory = prevHistory.filter((item) => item.query !== query);

      writeJsonStorage("local", HISTORY_STORAGE_KEY, nextHistory);

      return nextHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJsonStorage("local", HISTORY_STORAGE_KEY, []);
  }, []);

  const toggleHistoryEnabled = useCallback(() => {
    setIsHistoryEnabled((isEnabled) => {
      const nextEnabled = !isEnabled;

      writeStorage("local", HISTORY_ENABLED_STORAGE_KEY, String(nextEnabled));

      return nextEnabled;
    });
  }, []);

  return {
    addHistory,
    clearHistory,
    history,
    isHistoryEnabled,
    removeHistory,
    toggleHistoryEnabled,
  };
};

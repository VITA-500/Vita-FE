import type { RefObject } from "react";
import { CircleX, List, Menu, Search } from "lucide-react";
import { benefitServicePreviewItems } from "@/features/store/constants";
import type { MapCategory } from "@/features/store/types";

type StorePanelSearchBarProps = {
  activeMapCategory: MapCategory;
  hasActiveServiceFilter: boolean;
  hasMoreStorePages: boolean;
  isStoreListCollapsed: boolean;
  isTagSearchQuery: boolean;
  onClearFilters: () => void;
  onInputFocus: () => void;
  onInputMouseDown: () => void;
  onOpenSidebar?: () => void;
  onQueryChange: (nextQuery: string) => void;
  onSubmit: () => void;
  onToggleStoreList: () => void;
  /** 지금 핀으로 보이는(현재 페이지) 매장 수 */
  pagedStoreCount: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  /** 목록 전체 매장 수 */
  storeCount: number;
};

/** 지도 위 검색창: 사이드바 열기, 검색 입력, 필터 해제, 검색, 매장 목록 펼치기 */
export const StorePanelSearchBar = ({
  activeMapCategory,
  hasActiveServiceFilter,
  hasMoreStorePages,
  isStoreListCollapsed,
  isTagSearchQuery,
  onClearFilters,
  onInputFocus,
  onInputMouseDown,
  onOpenSidebar,
  onQueryChange,
  onSubmit,
  onToggleStoreList,
  pagedStoreCount,
  searchInputRef,
  searchQuery,
  storeCount,
}: StorePanelSearchBarProps) => (
  <div className="relative z-30 flex h-12 items-center rounded-sm bg-white text-left shadow-sm dark:bg-zinc-950">
    {onOpenSidebar && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenSidebar();
        }}
        className="text-brand hover:bg-brand-soft ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition md:hidden"
        aria-label="사이드바 열기"
      >
        <Menu size={20} />
      </button>
    )}
    <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 rounded-l-sm bg-white px-3.5 text-sm font-semibold text-gray-400 dark:bg-zinc-950">
      <input
        ref={searchInputRef}
        value={searchQuery}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onInputFocus}
        onMouseDown={onInputMouseDown}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit();
          }
        }}
        placeholder="매장명, 주소, 전화번호 검색"
        className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400/85 dark:text-white"
        aria-label="매장명, 주소, 전화번호 검색"
        title={isTagSearchQuery ? searchQuery : undefined}
      />
      {hasActiveServiceFilter && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClearFilters();
            searchInputRef.current?.focus();
          }}
          className="group/clear relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
          aria-label="선택한 필터 모두 해제"
        >
          <CircleX size={17} />
          <span className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover/clear:translate-y-0 group-hover/clear:opacity-100 group-focus-visible/clear:translate-y-0 group-focus-visible/clear:opacity-100">
            필터 모두 해제
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }}
        className="hover:text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300/90 transition hover:bg-gray-100 dark:hover:bg-white/10"
        aria-label="검색"
      >
        <Search size={22} />
      </button>
    </label>
    <button
      type="button"
      onClick={onToggleStoreList}
      className="border-border hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand group relative flex h-full w-12 shrink-0 items-center justify-center rounded-r-sm border-l bg-white text-xs font-extrabold text-gray-500 transition dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300"
      aria-expanded={!isStoreListCollapsed}
      aria-label={isStoreListCollapsed ? "지점 목록 펼치기" : "지점 목록 접기"}
    >
      <List
        size={18}
        className="transition group-hover:scale-0 group-hover:opacity-0"
      />
      <span className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
        {/* 지도에 찍힌 핀(현재 페이지) 개수 기준. 전체가 더 많으면 "현재/전체"로 표시 */}
        {activeMapCategory === "store"
          ? hasMoreStorePages
            ? `${pagedStoreCount}/${storeCount}`
            : `${storeCount}개`
          : `${benefitServicePreviewItems.length}개`}
      </span>
      <span className="pointer-events-none absolute top-[calc(100%+8px)] right-0 z-50 flex translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {activeMapCategory === "store" ? "매장 목록" : "제휴 혜택/서비스 목록"}
      </span>
    </button>
  </div>
);

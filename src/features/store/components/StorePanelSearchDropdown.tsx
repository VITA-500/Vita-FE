import { Clock3, X } from "lucide-react";
import { getServiceFilterIcon } from "@/features/store/lib/serviceFilterItems";
import { MAX_SEARCH_RESULT_COUNT } from "@/features/store/constants";
import type { StoreSearchHistoryItem } from "@/features/store/hooks/useStoreSearchHistory";
import type { StoreLocation } from "@/features/store/types";

type StorePanelSearchDropdownProps = {
  isSearchHistoryEnabled: boolean;
  onClearHistory: () => void;
  onRemoveHistory: (query: string) => void;
  onSelectHistory: (item: StoreSearchHistoryItem) => void;
  onSelectService: (service: string) => void;
  onSelectStore: (storeId: string) => void;
  onToggleHistoryEnabled: () => void;
  searchedServices: string[];
  searchHistory: StoreSearchHistoryItem[];
  searchQuery: string;
  searchResultStores: StoreLocation[];
};

/** 검색창 아래 드롭다운: 검색어가 있으면 서비스 추천·검색 결과, 없으면 최근 검색 기록 */
export const StorePanelSearchDropdown = ({
  isSearchHistoryEnabled,
  onClearHistory,
  onRemoveHistory,
  onSelectHistory,
  onSelectService,
  onSelectStore,
  onToggleHistoryEnabled,
  searchedServices,
  searchHistory,
  searchQuery,
  searchResultStores,
}: StorePanelSearchDropdownProps) => (
  <div className="absolute top-12 left-0 z-20 w-full overflow-hidden bg-white text-sm shadow-sm dark:bg-zinc-950">
    {searchQuery ? (
      <div className="max-h-[232px] overflow-y-auto overscroll-contain py-1">
        {/* 서비스로 찾기: 매장명보다 하려는 일로 찾는 경우를 위해 맨 위에 보여준다 */}
        {searchedServices.map((service) => {
          const ServiceIcon = getServiceFilterIcon(service);

          return (
            <button
              key={`service-${service}`}
              type="button"
              onClick={() => onSelectService(service)}
              className="flex h-11 w-full items-center gap-3 px-5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
            >
              <span className="bg-brand-soft text-brand dark:bg-brand/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <ServiceIcon size={13} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate">
                {service} 가능한 매장 찾기
              </span>
              <span className="text-brand shrink-0 text-[11px] font-extrabold">
                서비스
              </span>
            </button>
          );
        })}
        {searchResultStores.slice(0, MAX_SEARCH_RESULT_COUNT).map((store) => (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelectStore(store.id)}
            className="flex h-11 w-full items-center justify-between gap-3 px-5 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
          >
            <span className="min-w-0 truncate">{store.name}</span>
            {store.distanceText && (
              <span className="shrink-0 text-xs text-gray-400">
                {store.distanceText}
              </span>
            )}
          </button>
        ))}

        {searchResultStores.length === 0 && searchedServices.length === 0 && (
          <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
            지금 보이는 지도 영역에 검색 결과가 없어요.
          </div>
        )}
      </div>
    ) : isSearchHistoryEnabled && searchHistory.length > 0 ? (
      <div className="max-h-[232px] overflow-y-auto overscroll-contain py-1">
        {searchHistory.map((item) => (
          <div
            key={item.query}
            className="group flex items-center hover:bg-gray-50 dark:hover:bg-white/[0.04]"
          >
            <button
              type="button"
              onClick={() => onSelectHistory(item)}
              className="flex h-11 min-w-0 flex-1 items-center gap-3 pl-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-200"
            >
              <Clock3
                size={15}
                className="shrink-0 text-gray-300"
                aria-hidden="true"
              />
              <span className="min-w-0 truncate">{item.query}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemoveHistory(item.query)}
              className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/10"
              aria-label={`${item.query} 검색 기록 삭제`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex h-14 cursor-default items-center justify-center gap-2 text-gray-400/85">
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300/80 text-[11px] leading-none font-bold text-gray-300">
          i
        </span>
        <span className="text-sm font-medium">
          {isSearchHistoryEnabled
            ? "히스토리가 없어요."
            : "검색 히스토리 저장이 꺼져 있어요."}
        </span>
      </div>
    )}
    {!searchQuery && (
      <div className="flex h-12 cursor-default items-center justify-between gap-3 bg-gray-50 px-5 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleHistoryEnabled}
            className="cursor-pointer text-sm font-medium text-gray-400/90 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {isSearchHistoryEnabled ? "히스토리 끄기" : "히스토리 켜기"}
          </button>
        </div>
        {isSearchHistoryEnabled && searchHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="cursor-pointer text-sm font-medium text-gray-400/90 hover:text-gray-600 dark:hover:text-gray-200"
          >
            전체 삭제
          </button>
        )}
      </div>
    )}
  </div>
);

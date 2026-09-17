"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";
import { StoreList } from "@/features/store/components/StoreList";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import { storeService } from "@/features/store/lib/storeService";

type StoreMapPanelProps = {
  onOpenSidebar?: () => void;
};

export const StoreMapPanel = ({ onOpenSidebar }: StoreMapPanelProps) => {
  const stores = storeService.getNearbyStores();
  const [isStorePanelOpen, setIsStorePanelOpen] = useState(true);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const collapsedSearchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    activeFilter,
    displayStores,
    locationStatus,
    requestLocation,
    searchQuery,
    selectedStore,
    setActiveFilter,
    setSearchQuery,
    setSelectedStoreId,
    sortedStores,
    userLocation,
    visibleSelectedStoreId,
  } = useStoreMapState(stores);

  useEffect(() => {
    if (!isSearchHistoryOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        collapsedSearchRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsSearchHistoryOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchHistoryOpen]);

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden">
      <StoreMapPreview
        className="absolute inset-0"
        isFullBleed
        selectedStore={selectedStore}
        selectedStoreId={visibleSelectedStoreId}
        stores={displayStores.length > 0 ? displayStores : stores}
        userLocation={userLocation}
        onSelectStore={setSelectedStoreId}
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        {isStorePanelOpen ? (
          <div className="pointer-events-auto absolute right-0 bottom-0 left-0 h-[min(78vh,620px)] md:top-0 md:bottom-0 md:left-auto md:h-auto md:w-[min(420px,100%)]">
            <button
              type="button"
              onClick={() => setIsStorePanelOpen(false)}
              className="absolute top-px left-1/2 z-20 flex h-5 w-14 -translate-x-1/2 -translate-y-full items-center justify-center rounded-t-sm bg-white shadow-[0_-1px_3px_rgba(15,23,42,0.12)] transition hover:bg-gray-50 md:top-1/2 md:left-px md:h-14 md:w-5 md:-translate-x-full md:-translate-y-1/2 md:rounded-t-none md:rounded-l-sm md:shadow-[-1px_0_3px_rgba(15,23,42,0.12)] dark:bg-zinc-950 dark:hover:bg-zinc-900"
              aria-label="매장 패널 접기"
            >
              <span
                className="bg-brand h-2 w-3 [clip-path:polygon(0_0,100%_0,50%_100%)] md:h-3 md:w-2 md:[clip-path:polygon(0_0,100%_50%,0_100%)]"
                aria-hidden="true"
              />
            </button>

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_32px_rgba(15,23,42,0.10)] transition-transform duration-300 ease-out md:rounded-none md:shadow-[-12px_0_32px_rgba(15,23,42,0.08)] dark:bg-zinc-950">
              <div className="border-border flex h-14 shrink-0 items-center border-b px-4 dark:border-white/10">
                <span className="text-sm font-extrabold text-gray-950 dark:text-white">
                  매장 탐색
                </span>
              </div>

              <StoreList
                activeFilter={activeFilter}
                locationStatus={locationStatus}
                onActiveFilterChange={setActiveFilter}
                onQueryChange={setSearchQuery}
                onRefreshLocation={requestLocation}
                query={searchQuery}
                variant="docked"
                selectedStoreId={visibleSelectedStoreId}
                stores={sortedStores}
                onSelectStore={setSelectedStoreId}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              ref={collapsedSearchRef}
              className="pointer-events-auto absolute top-3 right-3 left-3 md:top-5 md:right-5 md:left-auto md:w-[min(420px,calc(100%-40px))]"
            >
              <div className="flex h-12 items-center overflow-hidden rounded-sm border-b border-gray-100 bg-white text-left shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <div className="bg-brand flex h-full w-[132px] shrink-0 items-center text-white md:w-[116px]">
                  {onOpenSidebar && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSidebar();
                      }}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 md:hidden"
                      aria-label="사이드바 열기"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchHistoryOpen(false);
                      setIsStorePanelOpen(true);
                    }}
                    className="hover:bg-brand-hover flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-extrabold transition md:px-0"
                    aria-label="매장 검색 패널 열기"
                  >
                    VITA map
                  </button>
                </div>
                <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 px-4 text-sm font-semibold text-gray-400">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchHistoryOpen(true)}
                    onMouseDown={() => {
                      if (document.activeElement === searchInputRef.current) {
                        setIsSearchHistoryOpen((isOpen) => !isOpen);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setIsSearchHistoryOpen(false);
                        setIsStorePanelOpen(true);
                      }
                    }}
                    placeholder="매장명, 주소, 전화번호 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400/85 dark:text-white"
                    aria-label="매장명, 주소, 전화번호 검색"
                  />
                  <Search size={22} className="shrink-0 text-gray-300/90" />
                </label>
              </div>

              {isSearchHistoryOpen && (
                <div className="ml-[116px] w-[calc(100%-116px)] overflow-hidden bg-white text-sm shadow-sm dark:bg-zinc-950">
                  {searchQuery ? (
                    <div className="max-h-48 overflow-y-auto py-1">
                      {displayStores.slice(0, 4).map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => {
                            setSelectedStoreId(store.id);
                            setIsSearchHistoryOpen(false);
                            setIsStorePanelOpen(true);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                        >
                          <span className="min-w-0 truncate">{store.name}</span>
                          {store.distanceText && (
                            <span className="shrink-0 text-xs text-gray-400">
                              {store.distanceText}
                            </span>
                          )}
                        </button>
                      ))}

                      {displayStores.length === 0 && (
                        <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
                          검색 결과가 없어요.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-14 cursor-default items-center justify-center gap-2 text-gray-400/85">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300/80 text-[11px] leading-none font-bold text-gray-300">
                        i
                      </span>
                      <span className="text-sm font-medium">
                        히스토리가 없어요.
                      </span>
                    </div>
                  )}
                  <div className="flex h-12 cursor-default items-center bg-gray-50 px-5 dark:bg-white/[0.04]">
                    <button
                      type="button"
                      className="cursor-pointer text-sm font-medium text-gray-400/90"
                    >
                      히스토리 끄기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearchHistoryOpen(false);
                setIsStorePanelOpen(true);
              }}
              className="pointer-events-auto absolute bottom-0 left-1/2 z-20 flex h-5 w-14 -translate-x-1/2 items-center justify-center rounded-t-sm bg-white shadow-[0_-1px_3px_rgba(15,23,42,0.12)] transition hover:bg-gray-50 md:top-1/2 md:right-0 md:bottom-auto md:left-auto md:h-14 md:w-5 md:translate-x-0 md:-translate-y-1/2 md:rounded-t-none md:rounded-l-sm md:shadow-[-1px_0_3px_rgba(15,23,42,0.12)] dark:bg-zinc-950 dark:hover:bg-zinc-900"
              aria-label="매장 검색 패널 열기"
            >
              <span
                className="bg-brand h-2 w-3 [clip-path:polygon(50%_0,0_100%,100%_100%)] md:h-3 md:w-2 md:[clip-path:polygon(100%_0,0_50%,100%_100%)]"
                aria-hidden="true"
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

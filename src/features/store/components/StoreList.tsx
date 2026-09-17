"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LocateFixed,
  LocateOff,
  Navigation,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import type { UserLocationStatus } from "@/features/store/hooks/useUserLocation";
import { matchesStoreSearch } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";
import { getKakaoDirectionUrl } from "@/features/store/lib/mapLinks";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui/Button";

type StoreCardProps = {
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  store: StoreLocation;
  storeRef?: (node: HTMLButtonElement | null) => void;
};

const StoreCard = ({
  index,
  isSelected,
  onSelect,
  store,
  storeRef,
}: StoreCardProps) => (
  <button
    ref={storeRef}
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={cn(
      "w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150",
      isSelected
        ? "border-brand/70 bg-white shadow-sm dark:bg-white/10"
        : "border-border hover:border-brand/40 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
    )}
  >
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
          isSelected ? "bg-brand text-white" : "bg-brand/10 text-brand",
        )}
      >
        {index + 1}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-text-primary truncate text-sm font-extrabold dark:text-white">
            {store.name}
          </span>

          {store.distanceText && (
            <span className="bg-surface-muted text-text-secondary shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300">
              {store.distanceText}
            </span>
          )}
        </span>

        <span className="text-text-secondary mt-2 block text-xs leading-5 dark:text-gray-400">
          {store.address}
        </span>

        <span className="text-text-secondary mt-3 flex items-center gap-1.5 text-xs font-semibold dark:text-gray-400">
          <Phone size={13} />
          {store.phone}
        </span>
      </span>
    </div>
  </button>
);

type StoreListProps = {
  activeFilter?: string;
  locationStatus?: UserLocationStatus;
  onActiveFilterChange?: (filter: string) => void;
  onQueryChange?: (query: string) => void;
  onRefreshLocation?: () => void;
  variant?: "card" | "docked";
  query?: string;
  selectedStoreId: string;
  stores: StoreLocation[];
  onSelectStore: (storeId: string) => void;
};

export const StoreList = ({
  activeFilter: activeFilterProp,
  locationStatus = "idle",
  onActiveFilterChange,
  onQueryChange,
  onRefreshLocation,
  onSelectStore,
  query: queryProp,
  selectedStoreId,
  stores,
  variant = "card",
}: StoreListProps) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [internalActiveFilter, setInternalActiveFilter] = useState("전체");
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);

  const query = queryProp ?? internalQuery;
  const activeFilter = activeFilterProp ?? internalActiveFilter;
  const filters = useMemo(() => {
    const districts = stores
      .map((store) => store.address.match(/서울\s+([^\s]+)/)?.[1])
      .filter((district): district is string => Boolean(district));

    return ["전체", ...Array.from(new Set(districts))];
  }, [stores]);

  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0];

  useEffect(() => {
    selectedCardRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedStoreId]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesFilter =
        activeFilter === "전체" || store.address.includes(activeFilter);

      return matchesFilter && matchesStoreSearch(store, query);
    });
  }, [activeFilter, query, stores]);

  const handleQueryChange = (nextQuery: string) => {
    if (onQueryChange) {
      onQueryChange(nextQuery);
      return;
    }

    setInternalQuery(nextQuery);
  };

  const handleFilterChange = (nextFilter: string) => {
    if (onActiveFilterChange) {
      onActiveFilterChange(nextFilter);
      return;
    }

    setInternalActiveFilter(nextFilter);
  };

  const locationMessage = {
    denied: "위치 권한이 거부되어 기본 거리 기준으로 표시 중",
    error: "현재 위치를 가져오지 못해 기본 거리 기준으로 표시 중",
    granted: "현재 위치 기준 거리순",
    idle: "현재 위치 기준 거리순",
    requesting: "현재 위치 확인 중",
    unsupported: "이 브라우저에서는 현재 위치를 사용할 수 없음",
  } satisfies Record<UserLocationStatus, string>;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col bg-white p-4 dark:bg-zinc-950",
        variant === "card" &&
          "border-border rounded-3xl border shadow-sm dark:border-white/10",
        variant === "docked" && "h-full",
      )}
    >
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <p className="text-text-primary text-sm font-extrabold dark:text-white">
            가까운 매장
          </p>
          <p className="text-text-secondary mt-1 text-xs dark:text-gray-400">
            {locationMessage[locationStatus]}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshLocation}
          className="border-border text-text-secondary hover:border-brand/50 hover:text-brand flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:text-gray-400"
          disabled={locationStatus === "requesting"}
          aria-label="매장 목록 새로고침"
        >
          {locationStatus === "granted" ? (
            <LocateFixed size={15} />
          ) : locationStatus === "denied" || locationStatus === "error" ? (
            <LocateOff size={15} />
          ) : (
            <RefreshCw
              size={15}
              className={cn(locationStatus === "requesting" && "animate-spin")}
            />
          )}
        </button>
      </div>

      <label className="border-border focus-within:border-brand/60 mb-3 flex h-11 items-center gap-2 rounded-2xl border bg-white px-3 text-sm transition dark:border-white/10 dark:bg-white/[0.04]">
        <Search size={16} className="text-text-secondary shrink-0" />
        <input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="매장명, 주소, 전화번호 검색"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
        />
      </label>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterChange(filter)}
            className={cn(
              "shrink-0 rounded-full px-3 py-2 text-xs font-extrabold transition",
              activeFilter === filter
                ? "bg-brand text-white"
                : "bg-surface-muted text-text-secondary hover:text-text-primary dark:bg-white/10 dark:text-gray-300 dark:hover:text-white",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div className="border-border mb-4 rounded-2xl border bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-brand text-xs font-extrabold">선택한 매장</p>
          <p className="text-text-primary mt-1 text-sm font-extrabold dark:text-white">
            {selectedStore.name}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`tel:${selectedStore.phone}`}
              className="border-border hover:border-brand/50 hover:text-brand flex h-10 items-center justify-center gap-2 rounded-xl border bg-white text-xs font-extrabold text-gray-700 transition dark:border-white/10 dark:bg-zinc-950 dark:text-gray-200"
            >
              <Phone size={14} />
              전화
            </a>
            <ButtonLink
              href={getKakaoDirectionUrl(selectedStore)}
              target="_blank"
              rel="noreferrer"
              size="sm"
              className="h-10 rounded-xl text-xs"
            >
              <Navigation size={14} />
              길찾기
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredStores.map((store, index) => (
          <StoreCard
            key={store.id}
            index={index}
            isSelected={selectedStoreId === store.id}
            onSelect={() => onSelectStore(store.id)}
            store={store}
            storeRef={
              selectedStoreId === store.id
                ? (node) => {
                    selectedCardRef.current = node;
                  }
                : undefined
            }
          />
        ))}

        {filteredStores.length === 0 && (
          <div className="border-border rounded-2xl border border-dashed p-5 text-center text-sm font-semibold text-gray-400 dark:border-white/10">
            검색 결과가 없어요.
          </div>
        )}
      </div>
    </aside>
  );
};

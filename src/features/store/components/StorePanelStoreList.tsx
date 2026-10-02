import type { RefObject } from "react";
import { BadgePercent, ChevronDown, X } from "lucide-react";
import { StorePanelPagination } from "@/features/store/components/StorePanelPagination";
import {
  benefitServicePreviewItems,
  mapCategoryOptions,
} from "@/features/store/constants";
import { getStoreMarkerLabel } from "@/features/store/lib/storeMarkerOverlays";
import type { MapCategory, StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

type StorePanelStoreListProps = {
  activeMapCategory: MapCategory;
  activeStorePage: number;
  currentStorePage: number;
  /** 첫 페이지(처음 보여주는 핀) 매장 수. "더보기"에 남은 개수를 계산한다. */
  firstPageSize: number;
  hasMoreStorePages: boolean;
  isStorePaginationOn: boolean;
  mapSelectedStoreId: string;
  onCategoryChange: (category: MapCategory) => void;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onSelectStore: (storeId: string) => void;
  onShowPagination: () => void;
  pagedMapStores: StoreLocation[];
  panelRef: RefObject<HTMLDivElement | null>;
  /** 목록 전체 매장 수 */
  storeCount: number;
  storePageCount: number;
};

/** 검색창 아래 매장 목록 패널: 매장/혜택 탭, 현재 페이지 매장, 더보기·페이지 이동 */
export const StorePanelStoreList = ({
  activeMapCategory,
  activeStorePage,
  currentStorePage,
  firstPageSize,
  hasMoreStorePages,
  isStorePaginationOn,
  mapSelectedStoreId,
  onCategoryChange,
  onClose,
  onPageChange,
  onSelectStore,
  onShowPagination,
  pagedMapStores,
  panelRef,
  storeCount,
  storePageCount,
}: StorePanelStoreListProps) => (
  <div
    ref={panelRef}
    className="absolute top-12 left-0 z-10 w-full overflow-hidden rounded-b-sm bg-white/95 shadow-sm backdrop-blur dark:bg-zinc-950/95"
  >
    <div className="border-border flex h-12 items-center justify-between gap-3 border-b px-3 dark:border-white/10">
      <span className="min-w-0 truncate text-sm font-extrabold text-gray-950 dark:text-white">
        {activeMapCategory === "store" ? "매장 목록" : "제휴 혜택/서비스 목록"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 rounded-sm border border-gray-200 bg-white p-0.5 text-[11px] font-extrabold dark:border-white/10 dark:bg-zinc-950">
          {mapCategoryOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = activeMapCategory === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onCategoryChange(item.value)}
                className={cn(
                  "group relative flex h-7 w-7 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
                  isSelected
                    ? "bg-brand text-white dark:text-zinc-950"
                    : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
                )}
                aria-label={`${item.label} 보기`}
                aria-pressed={isSelected}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-gray-200"
          aria-label="매장 목록 닫기"
        >
          <X size={15} />
        </button>
      </div>
    </div>

    <div className="max-h-[min(48vh,372px)] overflow-y-auto py-1">
      {activeMapCategory === "store" ? (
        <>
          {pagedMapStores.map((store, index) => (
            <button
              key={`${currentStorePage}:${store.id}`}
              type="button"
              onClick={() => onSelectStore(store.id)}
              className={cn(
                // 페이지가 바뀌면(key 변경으로 새로 그려짐) 서서히 나타난다.
                "animate-store-page-in flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                mapSelectedStoreId === store.id &&
                  "bg-brand-soft dark:bg-brand/10",
              )}
              aria-pressed={mapSelectedStoreId === store.id}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
                  mapSelectedStoreId === store.id
                    ? "bg-brand text-white"
                    : "bg-brand/10 text-brand",
                )}
              >
                {getStoreMarkerLabel(index)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-gray-800 dark:text-white">
                    {store.name}
                  </span>
                  {store.distanceText && (
                    <span className="shrink-0 text-[11px] font-bold text-gray-400">
                      {store.distanceText}
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-xs font-medium text-gray-400">
                  {store.address || "상세 주소 확인 중"}
                </span>
              </span>
            </button>
          ))}

          {storeCount === 0 && (
            <div className="flex h-20 items-center justify-center text-sm font-semibold text-gray-400">
              표시할 매장이 없어요.
            </div>
          )}

          {hasMoreStorePages && !isStorePaginationOn && (
            <button
              type="button"
              onClick={onShowPagination}
              className="text-text-secondary hover:text-text-primary flex h-11 w-full items-center justify-center gap-1 text-xs font-extrabold transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
              더보기
              <span className="text-gray-400">
                ({storeCount - firstPageSize}개 더)
              </span>
              <ChevronDown size={14} />
            </button>
          )}

          {hasMoreStorePages && isStorePaginationOn && (
            <StorePanelPagination
              activePage={activeStorePage}

              onPageChange={onPageChange}

              pageCount={storePageCount}
            />
          )}
        </>
      ) : (
        <div className="space-y-1 px-2 py-2">
          {benefitServicePreviewItems.map((item) => (
            <div
              key={item.title}
              className="rounded-sm px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
              <span className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="bg-brand/10 text-brand mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm"
                >
                  <BadgePercent size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-gray-800 dark:text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 font-medium text-gray-400">
                    {item.description}
                  </span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

import { Phone, RefreshCw } from "lucide-react";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

type StoreCardProps = {
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  store: StoreLocation;
};

const StoreCard = ({ index, isSelected, onSelect, store }: StoreCardProps) => (
  <button
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
  selectedStoreId: string;
  stores: StoreLocation[];
  onSelectStore: (storeId: string) => void;
};

export const StoreList = ({
  onSelectStore,
  selectedStoreId,
  stores,
}: StoreListProps) => (
  <aside className="border-border flex min-h-0 flex-col rounded-3xl border bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
    <div className="mb-4 flex items-center justify-between px-1">
      <div>
        <p className="text-text-primary text-sm font-extrabold dark:text-white">
          가까운 매장
        </p>
        <p className="text-text-secondary mt-1 text-xs dark:text-gray-400">
          현재 위치 기준 거리순
        </p>
      </div>

      <button
        type="button"
        className="border-border text-text-secondary hover:border-brand/50 hover:text-brand flex h-9 w-9 items-center justify-center rounded-full border transition dark:border-white/10 dark:text-gray-400"
        aria-label="매장 목록 새로고침"
      >
        <RefreshCw size={15} />
      </button>
    </div>

    <div className="space-y-3 overflow-y-auto pr-1">
      {stores.map((store, index) => (
        <StoreCard
          key={store.id}
          index={index}
          isSelected={selectedStoreId === store.id}
          onSelect={() => onSelectStore(store.id)}
          store={store}
        />
      ))}
    </div>
  </aside>
);

"use client";

import { MapPin, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { buildMarkerLabelById } from "@/features/store/lib/storePanelStores";
import {
  buildMarkerColorInfoById,
  buildServiceFilterColorByValue,
} from "@/features/store/lib/markerColors";
import type { StoreLocation } from "@/features/store/types";
import type { ChatStoreMap as ChatStoreMapData } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

const MAX_CHAT_STORE_COUNT = 5;

type ChatStoreMapProps = {
  storeMap: ChatStoreMapData;
};

const toStoreLocation = (store: ChatStoreMapData["stores"][number]) => ({
  ...store,
  address: store.address || "주소 정보 확인 중",
  phone: store.phone || "",
});

export const ChatStoreMap = ({ storeMap }: ChatStoreMapProps) => {
  const stores = useMemo(
    () => storeMap.stores.slice(0, MAX_CHAT_STORE_COUNT).map(toStoreLocation),
    [storeMap.stores],
  );
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const markerLabelById = useMemo(() => buildMarkerLabelById(stores), [stores]);
  const activeServices = useMemo(
    () => storeMap.activeServices?.slice(0, 4) ?? [],
    [storeMap.activeServices],
  );
  const markerColorInfoById = useMemo(() => {
    const colorByValue = buildServiceFilterColorByValue(
      activeServices.map((service) => ({ label: service, value: service })),
    );

    return buildMarkerColorInfoById({
      activeServiceFilters: activeServices,
      colorByValue,
      stores,
    });
  }, [activeServices, stores]);

  if (stores.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="h-[300px] sm:h-[340px]">
        <StoreMapPreview
          className="h-full rounded-none border-0 shadow-none"
          fitTarget={{
            key: stores.map((store) => store.id).join(":"),
            points: stores,
          }}
          markerLabelById={markerLabelById}
          markerColorInfoById={markerColorInfoById}
          selectedStore={selectedStore}
          selectedStoreId={selectedStore?.id ?? ""}
          stores={stores}
          userLocation={storeMap.origin ?? null}
          onSelectStore={setSelectedStoreId}
        />
      </div>

      <div className="border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        {activeServices.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5" />
            <span className="truncate">
              {activeServices.join(", ")} 가능 매장을 핀 색상에 반영했어요.
            </span>
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {stores.map((store, index) => (
            <StoreResultCard
              key={store.id}
              index={index}
              isSelected={store.id === selectedStore?.id}
              store={store}
              onSelect={() => setSelectedStoreId(store.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type StoreResultCardProps = {
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  store: StoreLocation;
};

const StoreResultCard = ({
  index,
  isSelected,
  onSelect,
  store,
}: StoreResultCardProps) => (
  <article
    role="button"
    tabIndex={0}
    className={cn(
      "focus-visible:ring-brand/30 min-w-[260px] flex-1 cursor-pointer rounded-xl border bg-white p-4 text-left transition outline-none focus-visible:ring-2 dark:bg-zinc-900",
      isSelected
        ? "border-brand shadow-[0_8px_24px_rgba(253,182,29,0.18)]"
        : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20",
    )}
    onClick={onSelect}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
      }
    }}
  >
    <div className="mb-3 flex items-start justify-between gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
          isSelected ? "bg-brand text-white" : "bg-brand/10 text-brand",
        )}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-text-primary truncate text-sm font-extrabold dark:text-white">
            {store.name}
          </span>
          {store.distanceText && (
            <span className="shrink-0 text-[11px] font-bold text-gray-400">
              {store.distanceText}
            </span>
          )}
        </span>
      </div>
      <MapPin className="text-brand mt-1 h-4 w-4 shrink-0" />
    </div>

    <ServiceBadges store={store} />
  </article>
);

const ServiceBadges = ({ store }: { store: StoreLocation }) => {
  const services = [
    ...(store.consultServices ?? []),
    ...(store.providedServices ?? []),
  ];
  const uniqueServices = Array.from(new Set(services)).slice(0, 4);

  if (uniqueServices.length === 0) {
    return (
      <p className="text-text-secondary truncate text-xs font-medium dark:text-gray-400">
        제공 서비스 확인 중
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueServices.map((service) => (
        <span
          key={service}
          className="bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300"
        >
          {service}
        </span>
      ))}
    </div>
  );
};

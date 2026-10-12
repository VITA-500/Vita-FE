import { CalendarCheck, MapPin, Navigation } from "lucide-react";
import { StoreOpenStatusBadge } from "@/features/store/components/StoreOpenStatusBadge";
import { getStoreMapRouteUrl } from "@/features/store/lib/mapLinks";
import { getServiceFilterColor } from "@/features/store/lib/markerColors";
import { getCurrentOpenStatus } from "@/features/store/lib/storeOpenHours";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

type ChatStoreResultCardProps = {
  cardRef: (element: HTMLElement | null) => void;
  index: number;
  isSelected: boolean;
  activeServices: readonly string[];
  matchedServices: readonly string[];
  serviceColorByValue: Record<string, string>;
  onReserve: (store: StoreLocation) => void;
  onSelect: () => void;
  store: StoreLocation;
};

export const ChatStoreResultCard = ({
  cardRef,
  activeServices,
  index,
  isSelected,
  matchedServices,
  onReserve,
  onSelect,
  serviceColorByValue,
  store,
}: ChatStoreResultCardProps) => {
  const canReserve = store.storeType !== "PARTNER";

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={cn(
        "focus-visible:ring-brand/30 flex h-full w-full min-w-0 cursor-pointer scroll-my-4 flex-col rounded-xl border bg-white p-3.5 text-left transition outline-none focus-visible:ring-2 dark:bg-zinc-900",
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
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
            isSelected ? "bg-brand text-white" : "bg-brand/10 text-brand",
          )}
        >
          {String.fromCharCode(65 + index)}
        </span>
        {/* 카드 폭이 좁아도 매장명이 잘리지 않게 이름은 한 줄을 다 쓰고(최대 2줄) 넘칠 때만 줄인다. */}
        <p
          className="text-text-primary line-clamp-2 min-w-0 flex-1 text-sm leading-5 font-extrabold break-keep dark:text-white"
          title={store.name}
        >
          {store.name}
        </p>
        <MapPin className="text-brand h-4 w-4 shrink-0" />
      </div>
      {/* 영업 상태·거리는 아래 서비스 뱃지와 같은 왼쪽 선에 맞춘다. */}
      <StoreCardMeta store={store} />

      <ServiceBadges
        matchedServices={matchedServices}
        serviceColorByValue={serviceColorByValue}
        store={store}
      />

      <StoreCardActions
        activeServices={activeServices}
        canReserve={canReserve}
        onReserve={onReserve}
        store={store}
      />
    </article>
  );
};

const StoreCardActions = ({
  activeServices,
  canReserve,
  onReserve,
  store,
}: {
  activeServices: readonly string[];
  canReserve: boolean;
  onReserve: (store: StoreLocation) => void;
  store: StoreLocation;
}) => (
  <div
    className={cn(
      "mt-auto grid gap-2 pt-3",
      canReserve ? "grid-cols-2" : "grid-cols-1",
    )}
  >
    {canReserve && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onReserve(store);
        }}
        className="border-brand text-brand hover:bg-brand-soft dark:hover:bg-brand/10 flex h-9 items-center justify-center gap-1.5 rounded-sm border bg-white text-xs font-extrabold transition dark:bg-zinc-950"
      >
        <CalendarCheck size={14} />
        예약하기
      </button>
    )}
    <a
      href={getStoreMapRouteUrl(store, activeServices)}
      onClick={(event) => event.stopPropagation()}
      className="bg-brand hover:bg-brand-hover flex h-9 items-center justify-center gap-1.5 rounded-sm text-xs font-extrabold text-white transition"
    >
      <Navigation size={14} />
      길찾기
    </a>
  </div>
);

const StoreCardMeta = ({ store }: { store: StoreLocation }) => {
  // 답변은 브라우저에 저장돼 나중에 다시 열리므로, 지금 시각 기준으로 다시 계산한다.
  const openNow = getCurrentOpenStatus(store);

  if (openNow === undefined && !store.distanceText) {
    return <div className="mb-3" />;
  }

  return (
    <div className="mt-2.5 mb-3 flex flex-wrap items-center gap-1.5">
      <StoreOpenStatusBadge
        businessHours={store.businessHours}
        openNow={openNow}
      />
      {store.distanceText && (
        <span className="text-[11px] font-bold text-gray-400">
          {store.distanceText}
        </span>
      )}
    </div>
  );
};

const ServiceBadges = ({
  matchedServices,
  serviceColorByValue,
  store,
}: {
  matchedServices: readonly string[];
  serviceColorByValue: Record<string, string>;
  store: StoreLocation;
}) => {
  const serviceOrder = Object.keys(serviceColorByValue);
  const getServiceOrder = (service: string) => {
    const order = serviceOrder.indexOf(service);

    return order === -1 ? serviceOrder.length : order;
  };
  const uniqueServices = Array.from(
    new Set([
      ...(store.consultServices ?? []),
      ...(store.providedServices ?? []),
    ]),
  ).sort((first, second) => getServiceOrder(first) - getServiceOrder(second));

  if (uniqueServices.length === 0) {
    return (
      <p className="text-text-secondary truncate text-xs font-medium dark:text-gray-400">
        제공 서비스 확인 중
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueServices.map((service) => {
        const isMatched = matchedServices.includes(service);

        return (
          <span
            key={service}
            className={cn(
              "bg-surface-muted text-text-secondary rounded-full border px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300",
              !isMatched && "border-transparent",
            )}
            style={
              isMatched
                ? {
                    borderColor:
                      serviceColorByValue[service] ?? getServiceFilterColor(0),
                    color:
                      serviceColorByValue[service] ?? getServiceFilterColor(0),
                  }
                : undefined
            }
          >
            {service}
          </span>
        );
      })}
    </div>
  );
};

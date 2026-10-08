import { CalendarCheck, MapPin, Navigation } from "lucide-react";
import { getStoreMapRouteUrl } from "@/features/store/lib/mapLinks";
import { getServiceFilterColor } from "@/features/store/lib/markerColors";
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
}: ChatStoreResultCardProps) => (
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

    <ServiceBadges
      matchedServices={matchedServices}
      serviceColorByValue={serviceColorByValue}
      store={store}
    />

    <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
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
      <a
        href={getStoreMapRouteUrl(store, activeServices)}
        onClick={(event) => event.stopPropagation()}
        className="bg-brand hover:bg-brand-hover flex h-9 items-center justify-center gap-1.5 rounded-sm text-xs font-extrabold text-white transition"
      >
        <Navigation size={14} />
        길찾기
      </a>
    </div>
  </article>
);

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

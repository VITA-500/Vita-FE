import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CornerUpRight,
  MapPin,
  MapPinned,
  Phone,
  SportShoe,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { StoreOpenStatusBadge } from "@/entities/store";
import { TransitRouteDetails } from "@/features/store/route/components/TransitRouteDetails";
import { buildTransitSteps } from "@/features/store/route/lib/storeRoutePreview";
import type { StoreRouteOption, TransitRouteStep } from "@/entities/route";
import type { StoreLocation } from "@/entities/store";
import type { StoreRouteMode } from "@/entities/route";
import { cn } from "@/shared/lib/cn";
import { formatDurationSeconds } from "@/shared/lib/geo";
import { Button } from "@/shared/ui/atoms/Button";

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";
const compactActionButtonClassName =
  "rounded-sm shadow-sm transition-shadow hover:shadow-md";

export type RouteSummary = {
  isLoading?: boolean;
  /** 가까운 매장인데 차량·자전거 경로가 크게 돌아가 도보를 추천하는지 */
  isWalkRecommended?: boolean;
  remainingDistanceText: string;
  travelTimeText: string;
  transitWalkTimeText?: string;
  transitSteps?: TransitRouteStep[];
  transitOptions?: StoreRouteOption[];
};

const StoreInfoRow = ({
  children,
  icon: Icon,
  isPanel,
  label,
}: {
  children: ReactNode;
  icon: LucideIcon;
  isPanel: boolean;
  label: string;
}) => (
  <div
    className={cn(
      "text-text-secondary flex items-start gap-2 font-semibold",
      isPanel ? "py-2.5 text-[13px] leading-5" : "py-1 text-xs leading-5",
    )}
  >
    <Icon
      size={isPanel ? 15 : 13}
      className="mt-0.5 shrink-0 text-gray-400"
      aria-label={label}
      role="img"
    />
    <span className="min-w-0 flex-1 break-words">{children}</span>
  </div>
);

const ServiceBadges = ({
  isPanel = false,
  services,
  title,
}: {
  isPanel?: boolean;
  services?: string[];
  title: string;
}) => {
  if (!services || services.length === 0) return null;

  return (
    <div className={isPanel ? "mt-5" : "mt-3"}>
      <p
        className={cn(
          "text-text-secondary mb-2 font-extrabold",
          isPanel ? "text-xs" : "text-[11px]",
        )}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {services.map((service) => (
          <span key={service} className={serviceBadgeClassName}>
            {service}
          </span>
        ))}
      </div>
    </div>
  );
};

export const SameLocationStorePager = ({
  currentIndex,
  onMove,
  totalCount,
}: {
  currentIndex: number;
  onMove: (direction: -1 | 1) => void;
  totalCount: number;
}) => (
  <div className="text-text-secondary flex items-center gap-0.5 rounded-full bg-gray-100 px-0.5 text-[11px] font-extrabold dark:bg-white/10">
    <button
      type="button"
      onClick={() => onMove(-1)}
      className="hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
      aria-label="같은 위치의 이전 매장"
    >
      <ChevronLeft size={14} />
    </button>
    <span aria-live="polite">
      {currentIndex + 1}/{totalCount}
    </span>
    <button
      type="button"
      onClick={() => onMove(1)}
      className="hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
      aria-label="같은 위치의 다음 매장"
    >
      <ChevronRight size={14} />
    </button>
  </div>
);

export const StoreInfoDetails = ({
  isPanel,
  isRouteMode,
  store,
}: {
  isPanel: boolean;
  isRouteMode: boolean;
  store: StoreLocation;
}) => (
  <>
    <div
      className={cn(
        isPanel
          ? "border-border mt-3 divide-y divide-gray-100 border-y dark:divide-white/10 dark:border-white/10"
          : "mt-1.5",
      )}
    >
      <StoreInfoRow icon={MapPin} isPanel={isPanel} label="주소">
        {store.address || "상세 주소 확인 중"}
      </StoreInfoRow>
      {store.phone && (
        <StoreInfoRow icon={Phone} isPanel={isPanel} label="전화번호">
          {store.phone}
        </StoreInfoRow>
      )}
      {!isRouteMode && store.businessHours && (
        <StoreInfoRow icon={Clock} isPanel={isPanel} label="운영시간">
          {store.businessHours}
        </StoreInfoRow>
      )}
    </div>
    {!isRouteMode && store.benefitDescription && (
      <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
        {store.benefitDescription}
      </p>
    )}
    {!isRouteMode && (
      <>
        <ServiceBadges
          isPanel={isPanel}
          title="상담 가능"
          services={store.consultServices}
        />
        <ServiceBadges
          isPanel={isPanel}
          title="제공 서비스"
          services={store.providedServices}
        />
      </>
    )}
  </>
);

export const StoreInfoTitle = ({ store }: { store: StoreLocation }) => (
  <div className="flex min-w-0 items-center gap-2">
    <p className="truncate text-base font-extrabold text-gray-950 dark:text-white">
      {store.name}
    </p>
    <StoreOpenStatusBadge
      businessHours={store.businessHours}
      openNow={store.openNow}
    />
  </div>
);

export const StoreRouteSummarySection = ({
  onFocusRoutePoints,
  onRouteModeChange,
  routeResultMessage,
  routeSummary,
  onTransitRouteSelect,
  selectedRouteMode,
  storeName,
}: {
  onFocusRoutePoints?: (points: { lat: number; lng: number }[]) => void;
  onRouteModeChange: (mode: StoreRouteMode) => void;
  onTransitRouteSelect?: (index: number) => void;
  routeResultMessage?: string | null;
  routeSummary?: RouteSummary | null;
  selectedRouteMode: StoreRouteMode;
  storeName: string;
}) => {
  const [expandedTransitRouteIndices, setExpandedTransitRouteIndices] =
    useState<number[]>([]);
  const [selectedTransitRouteIndex, setSelectedTransitRouteIndex] = useState(0);
  if (routeResultMessage) {
    return (
      <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-3 rounded-sm px-3 py-2.5 text-xs leading-5 font-extrabold whitespace-pre-line">
        {routeResultMessage}
      </div>
    );
  }

  if (!routeSummary) return null;

  const transitOptions = routeSummary.transitOptions ?? [];

  return (
    <>
      <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-3 rounded-sm px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
          <strong className="text-xl leading-none font-extrabold">
            {routeSummary.isLoading ? "계산 중" : routeSummary.travelTimeText}
          </strong>
          {!routeSummary.isLoading && (
            <span className="pb-0.5 text-[11px] leading-4 font-extrabold text-current/75">
              {selectedRouteMode === "transit" &&
              routeSummary.transitWalkTimeText
                ? `도보 ${routeSummary.transitWalkTimeText} · 총 ${routeSummary.remainingDistanceText}`
                : `총 ${routeSummary.remainingDistanceText}`}
            </span>
          )}
        </div>
      </div>
      {!routeSummary.isLoading && selectedRouteMode === "transit" && (
        <div className="mt-2 space-y-2">
          {transitOptions.length > 0 && (
            <div
              className="grid gap-1.5 rounded-sm bg-gray-100 p-1 dark:bg-white/10"
              style={{
                gridTemplateColumns: `repeat(${Math.min(transitOptions.length, 3)}, minmax(0, 1fr))`,
              }}
              aria-label="대중교통 경로 선택"
            >
              {transitOptions.map((option, index) => {
                const label = option.tags[0] ?? `대안 ${index + 1}`;
                const isSelected = selectedTransitRouteIndex === index;

                return (
                  <button
                    key={`route-tab-${index}-${label}`}
                    type="button"
                    onClick={() => {
                      setSelectedTransitRouteIndex(index);
                      setExpandedTransitRouteIndices([index]);
                      onTransitRouteSelect?.(index);
                    }}
                    className={cn(
                      "min-w-0 rounded-sm px-2 py-2 text-[11px] font-extrabold transition",
                      isSelected
                        ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-950 dark:text-white"
                        : "text-gray-500 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-white/10",
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="block truncate text-left">{label}</span>
                    <span className="mt-0.5 block truncate text-left text-[10px] font-bold text-gray-400">
                      {formatDurationSeconds(option.durationSeconds)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {transitOptions.map((option, index) => {
            const isExpanded = expandedTransitRouteIndices.includes(index);
            const isSelected = selectedTransitRouteIndex === index;
            const route = {
              mode: "transit" as const,
              distanceMeters: option.distanceMeters,
              durationSeconds: option.durationSeconds,
              path: option.path,
              segments: option.segments,
            };

            return (
              <div
                key={`${index}-${option.tags.join("-")}`}
                className={cn(
                  "rounded-sm border bg-white/80 p-2.5 dark:bg-white/5",
                  isSelected
                    ? "border-brand dark:border-brand"
                    : "border-gray-200 dark:border-white/10",
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setSelectedTransitRouteIndex(index);
                    onTransitRouteSelect?.(index);
                    setExpandedTransitRouteIndices(isExpanded ? [] : [index]);
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                      {option.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-brand-soft text-brand dark:bg-brand/15 rounded-full px-2 py-1 text-[10px] font-extrabold"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-gray-900 dark:text-white">
                      {formatDurationSeconds(option.durationSeconds)}
                    </span>
                  </span>
                  {option.transfers !== undefined && option.transfers > 0 && (
                    <span className="shrink-0 text-xs font-bold text-gray-500">
                      환승 {option.transfers}회
                    </span>
                  )}
                </button>
                {isExpanded && (
                  <TransitRouteDetails
                    defaultExpanded
                    destinationName={storeName}
                    onFocusPoints={onFocusRoutePoints}
                    steps={buildTransitSteps(route)}
                  />
                )}
              </div>
            );
          })}
          {transitOptions.length === 0 && (
            <TransitRouteDetails
              destinationName={storeName}
              onFocusPoints={onFocusRoutePoints}
              steps={routeSummary.transitSteps ?? []}
            />
          )}
        </div>
      )}
      {!routeSummary.isLoading && routeSummary.isWalkRecommended && (
        <div className="text-text-secondary mt-2 flex flex-col items-stretch gap-2 rounded-sm bg-gray-100 px-3 py-2 text-[11px] leading-4 font-bold break-keep sm:flex-row sm:items-center sm:justify-between sm:pr-1.5 dark:bg-white/10 dark:text-gray-300">
          <span className="min-w-0">가까운 거리라 도보 이동을 추천해요</span>
          <button
            type="button"
            onClick={() => onRouteModeChange("walk")}
            className="text-brand-hover dark:text-brand flex h-7 shrink-0 items-center justify-center gap-1 rounded-sm bg-white px-2 font-extrabold whitespace-nowrap shadow-sm transition hover:shadow-md dark:bg-zinc-950"
          >
            <SportShoe size={12} />
            도보로 보기
          </button>
        </div>
      )}
    </>
  );
};

export const StoreInfoActions = ({
  canReserve,
  isPanel,
  isRouteDestination,
  isRouteMode,
  onReserve,
  onShowNearbyStores,
  onStartRoute,
  store,
}: {
  canReserve: boolean;
  isPanel: boolean;
  isRouteDestination: boolean;
  isRouteMode: boolean;
  onReserve: (store: StoreLocation) => void;
  onShowNearbyStores: () => void;
  onStartRoute: (store: StoreLocation) => void;
  store: StoreLocation;
}) => (
  <div
    className={cn(
      "gap-2",
      isRouteMode || isPanel
        ? cn(
            "grid",
            canReserve && store.storeType !== "PARTNER"
              ? "grid-cols-2"
              : "grid-cols-1",
            isPanel && !isRouteMode ? "mt-6" : "mt-3",
          )
        : "mt-4 flex flex-wrap justify-end",
    )}
  >
    {isRouteDestination ? (
      <Button
        variant="primary"
        size="sm"
        className={cn(
          compactActionButtonClassName,
          isRouteMode && "h-9! px-3! text-[13px]!",
          isPanel && !isRouteMode && "h-11!",
        )}
        onClick={onShowNearbyStores}
      >
        <MapPinned size={16} />
        다른 매장 보기
      </Button>
    ) : (
      <Button
        variant="primary"
        size="sm"
        className={cn(
          compactActionButtonClassName,
          isRouteMode && "h-9! px-3! text-[13px]!",
          isPanel && !isRouteMode && "h-11!",
        )}
        onClick={() => onStartRoute(store)}
      >
        <CornerUpRight size={16} />
        길찾기
      </Button>
    )}
    {canReserve && store.storeType !== "PARTNER" && (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          compactActionButtonClassName,
          isRouteMode && "h-9! px-3! text-[13px]!",
          isPanel && !isRouteMode && "h-11!",
        )}
        onClick={() => onReserve(store)}
      >
        <CalendarCheck size={16} />
        예약하기
      </Button>
    )}
  </div>
);

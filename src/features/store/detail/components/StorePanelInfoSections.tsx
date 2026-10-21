import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CornerUpRight,
  MapPin,
  MapPinned,
  Phone,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { StoreOpenStatusBadge } from "@/entities/store";
import type { StoreLocation } from "@/entities/store";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/Button";

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";
const compactActionButtonClassName =
  "rounded-sm shadow-sm transition-shadow hover:shadow-md";

export type { RouteSummary } from "@/features/store/detail/components/StoreRouteSummarySection";
export { StoreRouteSummarySection } from "@/features/store/detail/components/StoreRouteSummarySection";

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

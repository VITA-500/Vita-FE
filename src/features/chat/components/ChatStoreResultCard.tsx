import type { ReactNode } from "react";
import {
  CalendarCheck,
  Clock,
  MapPin,
  Navigation,
  Phone,
  type LucideIcon,
} from "lucide-react";
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
  const isPartner = store.storeType === "PARTNER";
  const canReserve = !isPartner;

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
      {/* 영업 상태·거리(왼쪽)와 업종(오른쪽 끝)을 한 줄에 둔다. */}
      <StoreCardMeta store={store} />

      {/* 운영시간·주소·전화번호는 같은 글씨 크기·아이콘·간격의 줄로 맞춘다.
          제휴 매장은 혜택명(예: 음료 사이즈 업)만으로는 방문 판단이 어려워 주소·전화번호를 보여준다. */}
      <StoreInfoRows isPartner={isPartner} store={store} />

      {!isPartner && (
        <ServiceBadges
          matchedServices={matchedServices}
          serviceColorByValue={serviceColorByValue}
          store={store}
        />
      )}

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
  // 제휴 매장은 업종(카페·아이스크림·영화·외식·자동차·쇼핑·여가)을 함께 보여 어떤 매장인지 바로 알 수 있게 한다.
  const category =
    store.storeType === "PARTNER" ? store.benefitCategory?.trim() : "";

  if (openNow === undefined && !store.distanceText && !category) {
    return <div className="mb-2" />;
  }

  return (
    <div className="mt-2.5 mb-2 flex min-h-5 items-center gap-1.5">
      <StoreOpenStatusBadge
        businessHours={store.businessHours}
        openNow={openNow}
      />
      {store.distanceText && (
        <span className="text-[11px] font-bold text-gray-400">
          {store.distanceText}
        </span>
      )}
      {category && (
        <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-extrabold text-gray-500 dark:bg-white/10 dark:text-gray-300">
          {category}
        </span>
      )}
    </div>
  );
};

/** 주소가 없을 때 ChatStoreMap이 넣는 자리 문구. 실제 주소가 아니라 보여주지 않는다. */
const ADDRESS_PLACEHOLDER = "주소 정보 확인 중";

const InfoRow = ({
  children,
  icon: Icon,
  label,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  label: string;
  title?: string;
}) => (
  <div className="flex items-start gap-1.5">
    <dt className="sr-only">{label}</dt>
    <Icon
      aria-hidden="true"
      className="mt-[3px] h-3.5 w-3.5 shrink-0 text-gray-400"
    />
    <dd className="line-clamp-2 min-w-0 break-keep" title={title}>
      {children}
    </dd>
  </div>
);

const StoreInfoRows = ({
  isPartner,
  store,
}: {
  isPartner: boolean;
  store: StoreLocation;
}) => {
  const businessHours = store.businessHours?.trim() ?? "";
  const address =
    isPartner && store.address && store.address !== ADDRESS_PLACEHOLDER
      ? store.address
      : "";
  const phone = isPartner ? (store.phone?.trim() ?? "") : "";

  if (!businessHours && !address && !phone) {
    return isPartner ? (
      <p className="text-text-secondary mb-3 text-xs font-medium dark:text-gray-400">
        매장 정보 확인 중
      </p>
    ) : null;
  }

  return (
    <dl
      className={cn(
        "text-text-secondary space-y-1 text-xs leading-5 font-medium dark:text-gray-300",
        isPartner ? "mb-1" : "mb-2.5",
      )}
    >
      {businessHours && (
        <InfoRow icon={Clock} label="운영시간" title={businessHours}>
          {businessHours}
        </InfoRow>
      )}
      {address && (
        <InfoRow icon={MapPin} label="주소" title={address}>
          {address}
        </InfoRow>
      )}
      {phone && (
        <InfoRow icon={Phone} label="전화번호">
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            onClick={(event) => event.stopPropagation()}
            className="hover:text-brand underline-offset-2 hover:underline"
          >
            {phone}
          </a>
        </InfoRow>
      )}
    </dl>
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

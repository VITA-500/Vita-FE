import type { ReactNode } from "react";
import {
  CalendarCheck,
  Check,
  Clock,
  MapPin,
  Navigation,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { StoreOpenStatusBadge } from "@/features/store/components/StoreOpenStatusBadge";
import { getStoreMapRouteUrl } from "@/features/store/lib/mapLinks";
import { getServiceFilterColor } from "@/features/store/lib/markerColors";
import type { ChatStoreDistanceLabel } from "@/features/chat/lib/chatStoreMapOrigin";
import { getCurrentOpenStatus, type StoreLocation } from "@/entities/store";
import { cn } from "@/shared/lib/cn";
import { buttonClassName } from "@/shared/ui/atoms/Button";

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
  /** 거리 문구. 없으면 store.distanceText. 장소 기준 검색이면 마우스를 올렸을 때 내 위치 거리로 바뀐다. */
  distanceLabel?: ChatStoreDistanceLabel;
};

export const ChatStoreResultCard = ({
  cardRef,
  activeServices,
  distanceLabel,
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
        {/* 지도 핀 글자(A·B·C)와 맞추는 표기. 누르는 요소가 아니라 그림자·hover 없이 둔다.
            미선택은 테두리만(outline), 선택된 카드는 지도에서 선택된 핀처럼 브랜드색으로 채워 짝을 보여준다. */}
        <span
          aria-label={`지도 핀 ${String.fromCharCode(65 + index)}`}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-[11px] font-black transition-colors",
            isSelected
              ? "border-brand bg-brand text-white"
              : "border-gray-300 bg-white text-gray-500 dark:border-white/20 dark:bg-transparent dark:text-gray-400",
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
      <StoreCardMeta
        distance={
          distanceLabel ??
          (store.distanceText ? { text: store.distanceText } : undefined)
        }
        store={store}
      />

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

/**
 * 카드 안 버튼은 좁은 카드에 맞춰 높이·모서리·간격을 조금 줄인다.
 * cn은 클래스를 합치기만 해서(겹치는 값 정리 없음) 공통 버튼 값을 확실히 덮도록 important(!)를 붙인다.
 */
const cardActionClassName =
  "h-9! gap-1.5! rounded-sm! px-2! font-extrabold! shadow-none!";

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
    {/* 채팅 매장 탐색의 행동 순서: 예약하기(primary) > 가까운 매장 보기(답변 아래, outline) > 길찾기(secondary).
        공통 버튼 스타일(buttonClassName)을 쓰고, 카드 안 크기만 맞춘다. */}
    {canReserve && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onReserve(store);
        }}
        className={buttonClassName({
          variant: "primary",
          size: "xs",
          className: cardActionClassName,
        })}
      >
        <CalendarCheck size={14} />
        예약하기
      </button>
    )}
    <a
      href={getStoreMapRouteUrl(store, activeServices)}
      onClick={(event) => event.stopPropagation()}
      className={buttonClassName({
        variant: "secondary",
        size: "xs",
        className: cardActionClassName,
      })}
    >
      <Navigation size={14} />
      길찾기
    </a>
  </div>
);

/** 거리 문구. 장소 기준이면 마우스를 올렸을 때(키보드 포커스·모바일 탭 포함) 내 위치에서의 거리로 바꿔 보여준다. */
const StoreDistance = ({ distance }: { distance: ChatStoreDistanceLabel }) => {
  if (!distance.hoverText) {
    return (
      <span className="text-[11px] font-bold text-gray-400">
        {distance.text}
      </span>
    );
  }

  // 두 문구를 같은 칸에 겹쳐 두고, 호버하면 기본 문구는 왼쪽으로 밀려 사라지고 내 위치 거리가 오른쪽에서 밀려 들어온다.
  // 칸 너비는 긴 쪽에 맞춰져 문구가 바뀌어도 옆 요소가 움직이지 않는다.
  const slideClassName =
    "col-start-1 row-start-1 whitespace-nowrap transition duration-200 ease-out motion-reduce:transition-none";

  return (
    <span
      tabIndex={0}
      aria-label={`${distance.text}, ${distance.hoverText}`}
      className="group/distance inline-grid cursor-help overflow-hidden rounded text-[11px] font-bold text-gray-400 outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
      // 카드 선택(onClick)과 겹치지 않게 거리 문구에서의 키 입력은 카드로 넘기지 않는다.
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span
        aria-hidden="true"
        className={cn(
          slideClassName,
          "group-hover/distance:-translate-x-2 group-hover/distance:opacity-0 group-focus/distance:-translate-x-2 group-focus/distance:opacity-0",
        )}
      >
        {distance.text}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          slideClassName,
          "translate-x-2 text-gray-600 opacity-0 group-hover/distance:translate-x-0 group-hover/distance:opacity-100 group-focus/distance:translate-x-0 group-focus/distance:opacity-100 dark:text-gray-300",
        )}
      >
        {distance.hoverText}
      </span>
    </span>
  );
};

const StoreCardMeta = ({
  distance,
  store,
}: {
  distance?: ChatStoreDistanceLabel;
  store: StoreLocation;
}) => {
  // 답변은 브라우저에 저장돼 나중에 다시 열리므로, 지금 시각 기준으로 다시 계산한다.
  const openNow = getCurrentOpenStatus(store);
  // 제휴 매장은 업종(카페·아이스크림·영화·외식·자동차·쇼핑·여가)을 함께 보여 어떤 매장인지 바로 알 수 있게 한다.
  const category =
    store.storeType === "PARTNER" ? store.benefitCategory?.trim() : "";

  if (openNow === undefined && !distance && !category) {
    return <div className="mb-2" />;
  }

  return (
    <div className="mt-2.5 mb-2 flex min-h-5 items-center gap-1.5">
      <StoreOpenStatusBadge
        businessHours={store.businessHours}
        openNow={openNow}
      />
      {distance && <StoreDistance distance={distance} />}
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

  // 조건으로 찾은 서비스와 나머지를 한 줄에 섞으면, 색이 없는 뱃지가 "이 매장은 안 되는 서비스"처럼 읽힌다.
  // 조건에 맞는 서비스는 체크 표시와 함께 앞에 두고, 나머지는 "그 외 제공"으로 따로 묶어 모두 제공 서비스임을 드러낸다.
  const matched = uniqueServices.filter((service) =>
    matchedServices.includes(service),
  );
  const others = uniqueServices.filter(
    (service) => !matchedServices.includes(service),
  );
  const hasCondition = matched.length > 0;

  return (
    <div className="space-y-1.5">
      {hasCondition && (
        <div className="flex flex-wrap gap-1.5">
          {matched.map((service) => {
            const color =
              serviceColorByValue[service] ?? getServiceFilterColor(0);

            return (
              <span
                key={service}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                style={{
                  backgroundColor: `${color}1a`,
                  borderColor: color,
                  color,
                }}
              >
                <Check size={11} strokeWidth={3} aria-hidden="true" />
                {service}
              </span>
            );
          })}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {hasCondition && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              그 외 제공
            </span>
          )}
          {others.map((service) => (
            <span
              key={service}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
            >
              {service}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

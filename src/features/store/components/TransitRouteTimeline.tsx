import type { ReactNode } from "react";
import { SportShoe } from "lucide-react";
import { TransitStepIcon } from "@/features/store/components/TransitStepIcon";
import {
  TRANSIT_WALK_LINE_COLOR,
  type TransitTimelineItem,
} from "@/entities/route";
import { cn } from "@/shared/lib/cn";

/* 대중교통 길찾기 상세: 출발 → 도보·승차·환승·하차 → 도착을 세로 타임라인으로 보여준다. */

/** 긴 안내 문구·역 이름이 카드 밖으로 빠져나가지 않도록 줄바꿈한다. */
const wrapTextClassName = "break-keep [overflow-wrap:anywhere]";
const titleClassName = cn(
  "text-xs leading-6 font-extrabold text-gray-900 dark:text-white",
  wrapTextClassName,
);
const metaClassName =
  "mt-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400";

const vehicleTypeBadgeClassName: Record<string, string> = {
  간선: "bg-blue-600 text-white",
  광역: "bg-red-500 text-white",
  급행: "bg-red-500 text-white",
  지선: "bg-green-600 text-white",
};

const TimelineMarker = ({ item }: { item: TransitTimelineItem }) => {
  if (item.type === "walk") {
    return (
      <span className="z-10 flex h-6 w-6 items-center justify-center">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: TRANSIT_WALK_LINE_COLOR }}
        >
          <SportShoe size={11} />
        </span>
      </span>
    );
  }

  if (item.type === "board") {
    return (
      <span
        className="z-10 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
        style={{ backgroundColor: item.color }}
      >
        <TransitStepIcon kind={item.kind} size={13} />
      </span>
    );
  }

  const label =
    item.type === "start" ? "출발" : item.type === "end" ? "도착" : "하차";

  return (
    <span
      className={cn(
        "z-10 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-sm",
        item.type !== "alight" && "bg-brand",
      )}
      style={
        item.type === "alight" ? { backgroundColor: item.color } : undefined
      }
    >
      {label}
    </span>
  );
};

/** 타임라인 항목에서 누를 수 있는 부분: 지점(타는 곳·내리는 곳·도보 구간) / 탄 채로 이동하는 구간 */
export type TransitTimelinePart = "point" | "ride";

/**
 * 누르면 지도를 맞추는 영역. 안에 문단(p)·div가 있어 button 대신 버튼 역할의 div로 둔다
 * (HTML 규칙상 button 안에는 글자 요소만 넣을 수 있다). onSelect가 없으면 그냥 내용만 그린다.
 */
const SelectableBlock = ({
  children,
  className,
  label,
  onSelect,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onSelect?: () => void;
}) =>
  onSelect ? (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-label={label}
      className={cn(
        "-mx-1.5 cursor-pointer rounded-sm px-1.5 text-left transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10",
        className,
      )}
    >
      {children}
    </div>
  ) : (
    <div className={className}>{children}</div>
  );

const TimelineContent = ({
  item,
  onSelect,
}: {
  item: TransitTimelineItem;
  onSelect?: (part: TransitTimelinePart) => void;
}) => {
  const selectPoint = onSelect ? () => onSelect("point") : undefined;

  if (item.type === "start") {
    return <p className={titleClassName}>내 위치</p>;
  }

  if (item.type === "end") {
    return <p className={titleClassName}>{item.name}</p>;
  }

  if (item.type === "walk") {
    return (
      <SelectableBlock label="도보 구간 지도에서 보기" onSelect={selectPoint}>
        <p
          className={cn(
            "text-xs leading-6 font-bold text-gray-700 dark:text-gray-200",
            wrapTextClassName,
          )}
        >
          {item.text}
        </p>
        <p className={metaClassName}>{item.meta}</p>
      </SelectableBlock>
    );
  }

  if (item.type === "alight") {
    const stationName = item.stationName ?? item.lineName;

    return (
      <SelectableBlock
        label={`${stationName} 하차 지점 지도에서 보기`}
        onSelect={selectPoint}
      >
        <p className={titleClassName}>{stationName} 하차</p>
      </SelectableBlock>
    );
  }

  const stationName = item.stationName ?? item.lineName;

  // 승차·환승: 위쪽(역 이름)은 타는 곳, 아래쪽(노선·시간)은 탄 채로 이동하는 구간 전체를 지도에 맞춘다.
  return (
    <>
      <SelectableBlock
        label={`${stationName} ${item.action} 지점 지도에서 보기`}
        onSelect={selectPoint}
      >
        <p className={titleClassName}>
          {stationName} {item.action}
        </p>
      </SelectableBlock>
      <SelectableBlock
        className="mt-0.5"
        label={`${item.lineName} 탑승 구간 지도에서 보기`}
        onSelect={onSelect ? () => onSelect("ride") : undefined}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <span
            className={cn("text-[11px] font-extrabold", wrapTextClassName)}
            style={{ color: item.color }}
          >
            {item.lineName}
          </span>
          {item.vehicleType && (
            <span
              className={cn(
                "rounded-xs px-1 py-px text-[10px] leading-4 font-extrabold",
                vehicleTypeBadgeClassName[item.vehicleType] ??
                  "bg-gray-400 text-white dark:bg-white/20",
              )}
            >
              {item.vehicleType}
            </span>
          )}
        </div>
        <p className={metaClassName}>{item.meta}</p>
      </SelectableBlock>
    </>
  );
};

export const TransitRouteTimeline = ({
  isItemSelectable,
  items,
  onSelectItem,
}: {
  /** 항목을 눌러 지도를 그 구간에 맞출 수 있는지 */
  isItemSelectable?: (item: TransitTimelineItem) => boolean;
  items: TransitTimelineItem[];
  onSelectItem?: (item: TransitTimelineItem, part: TransitTimelinePart) => void;
}) => (
  <ol aria-label="대중교통 경로 상세">
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      const line = item.type === "end" ? null : item.line;

      return (
        // minmax(0,1fr): 긴 글자가 열 너비를 밀어내지 않고 줄바꿈되도록 최소 너비를 0으로 둔다.
        <li key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
          <div className="relative flex justify-center">
            <TimelineMarker item={item} />
            {line && !isLast && (
              <span
                aria-hidden="true"
                className="absolute top-6 bottom-0 left-1/2 -translate-x-1/2"
                style={
                  line.isDashed
                    ? { borderLeft: `2px dotted ${line.color}` }
                    : { backgroundColor: line.color, width: 4 }
                }
              />
            )}
          </div>
          <div
            className={cn(
              "min-w-0 pb-3",
              !isLast && "border-b border-gray-100 dark:border-white/10",
              index > 0 && "pt-2",
              isLast && "pb-0",
            )}
          >
            <TimelineContent
              item={item}
              onSelect={
                onSelectItem && isItemSelectable?.(item)
                  ? (part) => onSelectItem(item, part)
                  : undefined
              }
            />
          </div>
        </li>
      );
    })}
  </ol>
);

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { TransitStepIcon } from "@/features/store/components/TransitStepIcon";
import {
  TransitRouteTimeline,
  type TransitTimelinePart,
} from "@/features/store/components/TransitRouteTimeline";
import { useElementHeight } from "@/shared/hooks/useElementHeight";
import type { TransitRouteStep } from "@/entities/route";
import {
  buildTransitTimeline,
  TRANSIT_DEFAULT_COLOR,
  type TransitTimelineItem,
} from "@/entities/route";
import { cn } from "@/shared/lib/cn";

const expandTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

type RoutePoint = TransitRouteStep["path"][number];

/** 구간을 눌러 지도를 그 구간에 맞출 수 있을 때, 누를 수 있는 줄의 hover 모양 */
const focusableRowClassName =
  "-mx-1.5 block w-[calc(100%+12px)] rounded-sm px-1.5 text-left transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10";

/** 경로를 한눈에 보는 요약(구간별 노선·시간). 구간을 누르면 지도를 그 구간에 맞춘다. */
const TransitRouteSummaryList = ({
  onFocusPoints,
  steps,
}: {
  onFocusPoints?: (points: RoutePoint[]) => void;
  steps: TransitRouteStep[];
}) => (
  <ol className="space-y-0">
    {steps.map((step, index) => {
      const isLast = index === steps.length - 1;

      return (
        <li key={step.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
          <div className="relative flex justify-center">
            <span
              className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: step.color ?? TRANSIT_DEFAULT_COLOR }}
            >
              <TransitStepIcon kind={step.kind} size={13} />
            </span>
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-6 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-300 dark:bg-white/20"
              />
            )}
          </div>
          <div className={cn("min-w-0 pb-2.5", isLast && "pb-0")}>
            {onFocusPoints && step.path.length > 0 ? (
              <button
                type="button"
                onClick={() => onFocusPoints(step.path)}
                className={cn(focusableRowClassName, "py-0.5")}
                aria-label={`${step.lineName} 구간 지도에서 보기`}
              >
                <SummaryRowContent step={step} />
              </button>
            ) : (
              <SummaryRowContent step={step} />
            )}
          </div>
        </li>
      );
    })}
  </ol>
);

const SummaryRowContent = ({ step }: { step: TransitRouteStep }) => (
  <span className="flex min-w-0 items-center gap-1.5">
    <span className="truncate text-xs font-extrabold text-gray-900 dark:text-white">
      {step.lineName}
    </span>
    <span className="shrink-0 text-[11px] font-bold text-gray-500 dark:text-gray-400">
      {step.meta}
    </span>
  </span>
);

/**
 * 대중교통 경로 요약. 오른쪽 화살표 버튼을 누르면 요약 자리를 상세 타임라인으로 바꾼다.
 * onFocusPoints가 있으면 구간(요약 줄·상세의 도보/승차/하차)을 눌러 지도를 그 구간에 맞춘다.
 */
export const TransitRouteDetails = ({
  destinationName,
  onFocusPoints,
  steps,
}: {
  destinationName: string;
  onFocusPoints?: (points: RoutePoint[]) => void;
  steps: TransitRouteStep[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const contentHeight = useElementHeight(contentRef, steps.length > 0);
  const timelineItems = useMemo(
    () => buildTransitTimeline(steps, destinationName),
    [destinationName, steps],
  );
  /**
   * 상세 타임라인 항목 → 지도에 맞출 좌표.
   * - 승차·환승의 역 이름: 타는 곳(구간 시작점) 한 곳
   * - 승차·환승의 노선·시간(ride): 탄 채로 이동하는 구간 전체(타는 곳~내리는 곳)
   * - 하차: 내리는 곳(구간 끝점) 한 곳
   * - 도보: 걷는 구간 전체
   */
  const getTimelineItemPoints = (
    item: TransitTimelineItem,
    part: TransitTimelinePart = "point",
  ) => {
    if (item.type === "start" || item.type === "end") {
      return null;
    }

    const path = steps.find((step) => step.id === item.stepId)?.path ?? [];

    if (path.length === 0) {
      return null;
    }

    if (item.type === "board") {
      return part === "ride" ? path : [path[0]];
    }

    return item.type === "alight" ? [path[path.length - 1]] : path;
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-gray-200 bg-white/80 p-2.5 dark:border-white/10 dark:bg-white/5">
      {/*
        요약 ↔ 상세를 바꿀 때 두 블록이 동시에 늘고 줄면 높이가 매 프레임 두 번씩 바뀌어 버벅인다.
        내용은 바로 바꾸고(살짝 페이드), 감싸는 영역 높이만 이전 높이에서 새 높이로 한 번에 움직인다.
      */}
      <motion.div
        className="min-w-0 flex-1 overflow-hidden"
        initial={false}
        animate={{ height: contentHeight ?? "auto" }}
        transition={shouldReduceMotion ? { duration: 0 } : expandTransition}
      >
        <div ref={contentRef}>
          <motion.div
            key={isExpanded ? "detail" : "summary"}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {isExpanded ? (
              <TransitRouteTimeline
                items={timelineItems}
                onSelectItem={
                  onFocusPoints
                    ? (item, part) => {
                        const points = getTimelineItemPoints(item, part);

                        if (points) onFocusPoints(points);
                      }
                    : undefined
                }
                isItemSelectable={(item) =>
                  Boolean(onFocusPoints && getTimelineItemPoints(item))
                }
              />
            ) : (
              <TransitRouteSummaryList
                onFocusPoints={onFocusPoints}
                steps={steps}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "경로 상세 닫기" : "경로 상세 보기"}
      >
        <ChevronDown
          size={16}
          className={cn(
            "transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>
    </div>
  );
};

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { TransitStepIcon } from "@/features/store/components/TransitStepIcon";
import { TransitRouteTimeline } from "@/features/store/components/TransitRouteTimeline";
import { useElementHeight } from "@/features/store/hooks/useElementHeight";
import type { TransitRouteStep } from "@/features/store/lib/storeRoutePreview";
import {
  buildTransitTimeline,
  TRANSIT_DEFAULT_COLOR,
} from "@/features/store/lib/transitTimeline";
import { cn } from "@/shared/lib/cn";

const expandTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

/** 경로를 한눈에 보는 요약(구간별 노선·시간) */
const TransitRouteSummaryList = ({ steps }: { steps: TransitRouteStep[] }) => (
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
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-xs font-extrabold text-gray-900 dark:text-white">
                {step.lineName}
              </p>
              <span className="shrink-0 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {step.meta}
              </span>
            </div>
          </div>
        </li>
      );
    })}
  </ol>
);

/** 대중교통 경로 요약. 오른쪽 화살표 버튼을 누르면 요약 자리를 상세 타임라인으로 바꾼다. */
export const TransitRouteDetails = ({
  destinationName,
  steps,
}: {
  destinationName: string;
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
              <TransitRouteTimeline items={timelineItems} />
            ) : (
              <TransitRouteSummaryList steps={steps} />
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

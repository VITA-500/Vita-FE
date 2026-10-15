import type { TransitRouteStep } from "@/features/store/lib/storeRoutePreview";

/* 대중교통 길찾기 상세(출발 → 도보·승차·환승·하차 → 도착) 타임라인을 경로 구간에서 만든다. */

/** 이 항목 마커에서 다음 항목 마커까지 잇는 세로선 */
export type TransitTimelineLine = {
  color: string;
  isDashed: boolean;
};

type TransitKind = Exclude<TransitRouteStep["kind"], "walk">;

export type TransitTimelineItem =
  | { id: string; line: TransitTimelineLine; type: "start" }
  | {
      id: string;
      line: TransitTimelineLine;
      meta: string;
      /** 이 항목이 나타내는 경로 구간 id(TransitRouteStep.id). 누르면 지도를 그 구간에 맞춘다. */
      stepId: string;
      text: string;
      type: "walk";
    }
  | {
      action: "승차" | "환승";
      color: string;
      id: string;
      kind: TransitKind;
      line: TransitTimelineLine;
      lineName: string;
      meta: string;
      stationName?: string;
      stepId: string;
      type: "board";
      vehicleType?: string;
    }
  | {
      color: string;
      id: string;
      kind: TransitKind;
      line: TransitTimelineLine;
      lineName: string;
      stationName?: string;
      stepId: string;
      type: "alight";
    }
  | { id: string; name: string; type: "end" };

export const TRANSIT_WALK_LINE_COLOR = "#9ca3af";
export const TRANSIT_DEFAULT_COLOR = "#64748b";

const walkLine: TransitTimelineLine = {
  color: TRANSIT_WALK_LINE_COLOR,
  isDashed: true,
};

const getStepLine = (step?: TransitRouteStep): TransitTimelineLine =>
  !step || step.kind === "walk"
    ? walkLine
    : { color: step.color ?? TRANSIT_DEFAULT_COLOR, isDashed: false };

const isTransitStep = (
  step?: TransitRouteStep,
): step is TransitRouteStep & { kind: TransitKind } =>
  Boolean(step && step.kind !== "walk");

/** 앞 구간 하차역에서 바로 다음 구간을 타는지(같은 역·정류장 환승) */
const isTransferBetween = (
  previous?: TransitRouteStep,
  next?: TransitRouteStep,
) =>
  isTransitStep(previous) &&
  isTransitStep(next) &&
  Boolean(previous.alightName) &&
  previous.alightName === next.boardName;

export const buildTransitTimeline = (
  steps: TransitRouteStep[],
  destinationName: string,
): TransitTimelineItem[] => {
  if (steps.length === 0) {
    return [];
  }

  const items: TransitTimelineItem[] = [
    { id: "start", line: getStepLine(steps[0]), type: "start" },
  ];

  steps.forEach((step, index) => {
    const previous = steps[index - 1];
    const next = steps[index + 1];

    if (!isTransitStep(step)) {
      // 같은 역 환승 사이의 도보(역 안 이동)는 환승 지점 하나로 합쳐 보여준다.
      if (isTransferBetween(previous, next)) {
        return;
      }

      const nextPlaceName = next ? next.boardName : destinationName;

      items.push({
        id: step.id,
        line: walkLine,
        meta: step.detailMeta,
        stepId: step.id,
        text:
          step.guidance ??
          (nextPlaceName ? `${nextPlaceName}까지 도보 이동` : "도보 이동"),
        type: "walk",
      });
      return;
    }

    // 역 안 도보를 건너뛴 앞뒤 대중교통 구간
    const previousTransit =
      previous?.kind === "walk" ? steps[index - 2] : previous;
    const nextTransit = next?.kind === "walk" ? steps[index + 2] : next;
    const color = step.color ?? TRANSIT_DEFAULT_COLOR;

    items.push({
      action: isTransferBetween(previousTransit, step) ? "환승" : "승차",
      color,
      id: `${step.id}:board`,
      kind: step.kind,
      line: getStepLine(step),
      lineName: step.lineName,
      meta: step.detailMeta,
      stationName: step.boardName,
      stepId: step.id,
      type: "board",
      vehicleType: step.vehicleType,
    });

    // 바로 환승하면 하차 대신 다음 구간의 "환승" 항목으로 표시한다.
    if (!isTransferBetween(step, nextTransit)) {
      items.push({
        color,
        id: `${step.id}:alight`,
        kind: step.kind,
        line: getStepLine(next),
        lineName: step.lineName,
        stationName: step.alightName,
        stepId: step.id,
        type: "alight",
      });
    }
  });

  items.push({ id: "end", name: destinationName, type: "end" });

  return items;
};

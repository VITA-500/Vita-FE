import type { RouteSegmentResponse } from "@/features/store/lib/storeRouteResponseTypes";
import { subwayLineColors } from "@/features/store/lib/subwayLineColors";
import type { StoreRouteSegmentKind } from "@/features/store/types";

/* 길찾기 응답의 구간 하나를 화면용 값(구간 종류·노선 이름·노선 색)으로 맞춘다. */

export const normalizeSegmentKind = (
  segment: RouteSegmentResponse,
): StoreRouteSegmentKind => {
  // ODsay trafficType: 1 지하철, 2 버스, 3 도보
  const trafficTypeCode = Number(segment.trafficType);

  if (trafficTypeCode === 1) return "subway";
  if (trafficTypeCode === 2) return "bus";
  if (trafficTypeCode === 3) return "walk";

  const rawKind = String(
    segment.kind ??
      segment.mode ??
      segment.type ??
      segment.transportType ??
      segment.transitType ??
      segment.vehicleType ??
      segment.transport?.type ??
      segment.transit?.type ??
      segment.subway?.type ??
      segment.bus?.type ??
      "",
  )
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (
    rawKind.includes("walk") ||
    rawKind.includes("pedestrian") ||
    rawKind.includes("도보")
  ) {
    return "walk";
  }

  if (
    rawKind.includes("subway") ||
    rawKind.includes("metro") ||
    rawKind.includes("지하철")
  ) {
    return "subway";
  }

  if (rawKind.includes("bus") || rawKind.includes("버스")) {
    return "bus";
  }

  if (rawKind.includes("car")) {
    return "car";
  }

  if (rawKind.includes("bike") || rawKind.includes("bicycle")) {
    return "bicycle";
  }

  return "transit";
};

const normalizeColor = (color?: string) => {
  if (!color) {
    return undefined;
  }

  return color.startsWith("#") ? color : `#${color}`;
};

export const getSegmentLineName = (segment: RouteSegmentResponse) =>
  segment.lineName ??
  segment.subwayLineName ??
  segment.subwayLine ??
  segment.routeName ??
  segment.line ??
  segment.name ??
  segment.transport?.lineName ??
  segment.transport?.routeName ??
  segment.transport?.line ??
  segment.transport?.name ??
  segment.transit?.lineName ??
  segment.transit?.routeName ??
  segment.transit?.line ??
  segment.transit?.name ??
  segment.subway?.lineName ??
  segment.subway?.routeName ??
  segment.subway?.line ??
  segment.subway?.name ??
  segment.bus?.lineName ??
  segment.bus?.routeName ??
  segment.bus?.line ??
  segment.bus?.name ??
  (typeof segment.route === "string"
    ? segment.route
    : (segment.route?.lineName ??
      segment.route?.routeName ??
      segment.route?.line ??
      segment.route?.name)) ??
  segment.lane?.[0]?.name ??
  segment.lane?.[0]?.busNo ??
  (segment.lane?.[0]?.subwayCode !== undefined
    ? `${segment.lane[0].subwayCode}호선`
    : undefined);

export const getSegmentColor = (segment: RouteSegmentResponse) => {
  const responseColor = normalizeColor(
    segment.color ??
      segment.routeColor ??
      segment.lineColor ??
      segment.transport?.color ??
      segment.transport?.routeColor ??
      segment.transport?.lineColor ??
      segment.transit?.color ??
      segment.transit?.routeColor ??
      segment.transit?.lineColor ??
      segment.subway?.color ??
      segment.subway?.routeColor ??
      segment.subway?.lineColor ??
      segment.bus?.color ??
      segment.bus?.routeColor ??
      segment.bus?.lineColor ??
      (typeof segment.route === "string"
        ? undefined
        : (segment.route?.color ??
          segment.route?.routeColor ??
          segment.route?.lineColor)),
  );

  if (responseColor) {
    return responseColor;
  }

  const lineName = getSegmentLineName(segment);

  if (!lineName) {
    return undefined;
  }

  // 노선명으로 색을 추정하는 건 지하철만. (버스 "공항버스" 등이 지하철 색으로 오인되지 않도록)
  if (normalizeSegmentKind(segment) !== "subway") {
    return undefined;
  }

  const normalizedLineName = lineName.replace(/\s/g, "");
  const lineNumber = normalizedLineName.match(/(\d+)호선/)?.[1];

  if (lineNumber && subwayLineColors[lineNumber]) {
    return subwayLineColors[lineNumber];
  }

  if (subwayLineColors[normalizedLineName]) {
    return subwayLineColors[normalizedLineName];
  }

  // "신분당선"이 "분당"에 먼저 걸리지 않도록 긴 이름부터, 숫자 단독 키는 제외하고 비교한다.
  const matchedLineKey = Object.keys(subwayLineColors)
    .filter((lineKey) => !/^\d+$/.test(lineKey))
    .sort((first, second) => second.length - first.length)
    .find((lineKey) => normalizedLineName.includes(lineKey));

  return matchedLineKey ? subwayLineColors[matchedLineKey] : undefined;
};

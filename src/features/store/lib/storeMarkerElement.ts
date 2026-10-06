import type { StoreMarkerGroupEntry } from "@/features/store/lib/kakaoMapTypes";
import {
  createExtraServiceBadgeElement,
  playMarkerEnterAnimation,
} from "@/features/store/lib/mapOverlayElements";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import {
  getMarkerGradientId,
  getStorePinSvgMarkup,
  STORE_PIN_SHAPE_CLASS_NAME,
} from "@/features/store/lib/storePinSvg";
import { cn } from "@/shared/lib/cn";

/** 매장 핀(묶음 핀 포함) DOM을 만든다. 이벤트 연결과 overlay 생성은 createStoreMarkerOverlay가 맡는다. */
export const createStoreMarkerElement = ({
  getLabel,
  group,
  isStoreCardShown,
  markerColorInfo,
  selectedEntry,
  shouldAnimateEnter,
}: {
  getLabel: (entry: StoreMarkerGroupEntry) => string;
  group: StoreMarkerGroupEntry[];
  isStoreCardShown: boolean;
  markerColorInfo?: MarkerColorInfo;
  selectedEntry?: StoreMarkerGroupEntry;
  shouldAnimateEnter: boolean;
}) => {
  const [{ store: firstStore }] = group;
  const isCluster = group.length > 1;
  const isSelected = Boolean(selectedEntry);
  const markerColors = markerColorInfo?.colors ?? [];
  const coordinateKey = `${firstStore.lat.toFixed(5)}:${firstStore.lng.toFixed(5)}`;
  const gradientId = getMarkerGradientId({
    colors: markerColors,
    coordinateKey,
    storeIds: group.map(({ store }) => store.id),
  });
  const container = document.createElement("div");
  container.className = "relative";

  if (shouldAnimateEnter) {
    playMarkerEnterAnimation(container);
  }
  const marker = document.createElement("button");
  marker.type = "button";
  marker.setAttribute(
    "aria-label",
    isCluster
      ? `같은 위치 매장 ${group.length}곳 보기`
      : `${firstStore.name} 선택`,
  );
  marker.className = cn(
    "group relative block h-[46px] w-[38px] translate-y-[-8px] border-0 bg-transparent p-0 text-xs leading-none font-black text-white transition duration-150 hover:translate-y-[-10px] hover:scale-[1.04]",
    isSelected && "translate-y-[-10px] scale-[1.04]",
  );
  const markerShape = document.createElement("span");
  markerShape.className = STORE_PIN_SHAPE_CLASS_NAME;
  markerShape.innerHTML = getStorePinSvgMarkup({
    colors: markerColors,
    gradientId,
  });

  const markerLetter = document.createElement("span");
  markerLetter.className =
    "absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white [text-shadow:_0_1px_2px_rgb(15_23_42_/_0.45)]";
  markerLetter.textContent = isCluster
    ? String(group.length)
    : getLabel(group[0]);

  const markerTooltip = document.createElement("span");
  markerTooltip.className = cn(
    "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100",
    isSelected && "translate-y-0 opacity-100",
    // 정보 카드가 떠 있으면 카드에 매장명이 있으므로 선택 핀의 이름 툴팁은 숨긴다.
    isSelected && isStoreCardShown && "hidden",
  );
  markerTooltip.textContent = selectedEntry
    ? selectedEntry.store.name
    : isCluster
      ? `같은 위치 매장 ${group.length}곳`
      : firstStore.name;

  if (isCluster) {
    // 묶음 핀임을 알 수 있도록 오른쪽 위에 작은 겹침 표시를 단다.
    const clusterBadge = document.createElement("span");

    clusterBadge.setAttribute("aria-hidden", "true");
    clusterBadge.className =
      "text-brand absolute -top-1 right-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] leading-none font-black shadow-sm";
    clusterBadge.style.color = markerColors[0] ?? "";
    clusterBadge.textContent = "+";
    marker.append(clusterBadge);
  }

  if (markerColorInfo && markerColorInfo.extraServices.length > 0) {
    marker.append(
      createExtraServiceBadgeElement(markerColorInfo.extraServices),
    );
  }

  marker.append(markerShape, markerLetter, markerTooltip);
  container.append(marker);

  return { container, marker };
};

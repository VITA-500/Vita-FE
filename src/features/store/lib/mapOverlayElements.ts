import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import type {
  KakaoMapsApi,
  MapOverlayHandle,
  StoreMarkerGroupEntry,
} from "@/features/store/lib/kakaoMapTypes";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

/** 페이지 전환 등으로 새로 나타나는 핀·원이 서서히 보이는 시간(ms) */
export const MARKER_ENTER_ANIMATION_MS = 280;

/** 핀·원 DOM이 아래에서 살짝 떠오르며 나타나게 한다. */
export const playMarkerEnterAnimation = (element: HTMLElement) => {
  element.animate?.(
    [
      { opacity: 0, transform: "translateY(6px) scale(0.85)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: MARKER_ENTER_ANIMATION_MS, easing: "ease-out", fill: "both" },
  );
};

export type ExtraService = MarkerColorInfo["extraServices"][number];

export const getExtraServicesLabel = (services: ExtraService[]) =>
  services.map((service) => service.label).join(", ");

export const createExtraServiceBadgeElement = (services: ExtraService[]) => {
  const badge = document.createElement("span");
  const tooltip = document.createElement("span");

  badge.setAttribute(
    "aria-label",
    `추가 필터 조건: ${getExtraServicesLabel(services)}`,
  );
  badge.className =
    "group/extra absolute -top-1 left-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/90 px-1 text-[9px] leading-none font-black text-white shadow-sm";
  badge.textContent = `+${services.length}`;
  tooltip.className =
    "pointer-events-none absolute top-[calc(100%+6px)] left-0 z-[4] flex min-w-max translate-y-1 flex-col gap-1 rounded-sm bg-slate-950/95 px-2.5 py-1.5 text-[10px] leading-snug font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/extra:translate-y-0 group-hover/extra:opacity-100 group-focus-visible/extra:translate-y-0 group-focus-visible/extra:opacity-100";

  services.forEach((service) => {
    const row = document.createElement("span");
    const dot = document.createElement("span");
    const label = document.createElement("span");

    row.className = "flex items-center gap-1.5";
    dot.className = "h-2 w-2 shrink-0 rounded-full";
    dot.style.backgroundColor = service.color;
    label.textContent = service.label;
    row.append(dot, label);
    tooltip.append(row);
  });

  badge.append(tooltip);
  return badge;
};

export const createClusterListElement = ({
  group,
  getLabel,
  onSelect,
  selectedStoreId,
}: {
  group: StoreMarkerGroupEntry[];
  getLabel: (entry: StoreMarkerGroupEntry) => string;
  onSelect: (entry: StoreMarkerGroupEntry, event: MouseEvent) => void;
  selectedStoreId: string;
}) => {
  const clusterList = document.createElement("div");
  const listTitle = document.createElement("p");
  const list = document.createElement("div");

  clusterList.className =
    "absolute bottom-[calc(100%+4px)] left-1/2 z-[3] w-56 -translate-x-1/2 overflow-hidden rounded-sm bg-white text-left shadow-lg ring-1 ring-gray-950/5 dark:bg-zinc-950 dark:ring-white/10";
  listTitle.className =
    "border-b border-gray-100 px-3 py-2 text-[11px] font-extrabold text-gray-400 dark:border-white/10";
  listTitle.textContent = `같은 위치 매장 ${group.length}곳`;
  list.className = "max-h-56 overflow-y-auto py-1";

  group.forEach((entry) => {
    const item = document.createElement("button");
    const itemLabel = document.createElement("span");
    const itemName = document.createElement("span");
    const isItemSelected = entry.store.id === selectedStoreId;

    item.type = "button";
    item.className = cn(
      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold transition",
      isItemSelected
        ? "bg-brand-soft text-gray-900 dark:bg-brand/10 dark:text-white"
        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]",
    );
    itemLabel.className =
      "bg-brand flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-black text-white";
    itemLabel.textContent = getLabel(entry);
    itemName.className = "min-w-0 truncate";
    itemName.textContent = entry.store.name;
    item.append(itemLabel, itemName);
    item.addEventListener("click", (event) => onSelect(entry, event));
    list.append(item);
  });

  clusterList.append(listTitle, list);
  return clusterList;
};

/** 나머지 매장 위치를 표시하는 반투명 원(+ 매장명 툴팁) DOM을 만든다. */
export const createOtherStoreDotElement = (store: StoreLocation) => {
  const dot = document.createElement("button");
  const tooltip = document.createElement("span");

  dot.type = "button";
  dot.setAttribute("aria-label", `${store.name} 선택`);
  // 지도 위에서도 잘 보이도록 브랜드 진한 색(brand-hover) + 흰 테두리 + 그림자로 표시한다.
  dot.className =
    "group bg-brand-hover relative block h-4 w-4 rounded-full border-2 border-white p-0 opacity-80 shadow-[0_2px_6px_rgba(15,23,42,0.35)] transition duration-150 hover:scale-125 hover:opacity-100";

  playMarkerEnterAnimation(dot);
  tooltip.className =
    "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100";
  tooltip.textContent = store.name;
  dot.append(tooltip);

  return dot;
};

/**
 * 나머지 매장 원을 지도 위 overlay로 올리고, 클릭·hover 이벤트를 연결한다.
 * 선택 시 처리(최신 ref·state 반영)는 호출하는 effect가 onSelect로 넘긴다.
 */
export const createOtherStoreOverlay = ({
  kakaoMaps,
  map,
  store,
  onSelect,
}: {
  kakaoMaps: KakaoMapsApi;
  map: KakaoMap;
  store: StoreLocation;
  onSelect: (event: MouseEvent) => void;
}): MapOverlayHandle => {
  const dot = createOtherStoreDotElement(store);

  dot.addEventListener("click", onSelect);

  const overlay = new kakaoMaps.CustomOverlay({
    content: dot,
    map,
    position: new kakaoMaps.LatLng(store.lat, store.lng),
    xAnchor: 0.5,
    yAnchor: 0.5,
    // 핀(10~)보다 아래에 깔아 핀을 가리지 않게 한다.
    zIndex: 5,
  });
  const handleDotEnter = () => overlay.setZIndex?.(40);
  const handleDotLeave = () => overlay.setZIndex?.(5);

  dot.addEventListener("mouseenter", handleDotEnter);
  dot.addEventListener("mouseleave", handleDotLeave);

  return {
    cleanup: () => {
      dot.removeEventListener("click", onSelect);
      dot.removeEventListener("mouseenter", handleDotEnter);
      dot.removeEventListener("mouseleave", handleDotLeave);
    },
    overlay,
  };
};

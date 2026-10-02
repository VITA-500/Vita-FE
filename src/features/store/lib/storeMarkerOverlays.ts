import type { UserLocation } from "@/features/store/lib/geo";
import type {
  KakaoMapsApi,
  MapOverlayHandle,
  StoreMarkerGroupEntry,
} from "@/features/store/lib/kakaoMapTypes";
import type { MapPoint } from "@/features/store/lib/mapFit";
import {
  createClusterListElement,
  createExtraServiceBadgeElement,
  playMarkerEnterAnimation,
} from "@/features/store/lib/mapOverlayElements";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import {
  getMarkerGradientId,
  getStorePinSvgMarkup,
  STORE_PIN_SHAPE_CLASS_NAME,
} from "@/features/store/lib/storePinSvg";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

export const getStoreMarkerLabel = (index: number) =>
  String.fromCharCode(65 + (index % 26));

/** 같은 좌표(소수 5자리, 약 1m)에 있는 매장들을 한 묶음으로 모은다. 묶음 순서는 stores에서 처음 나온 순서를 따른다. */
export const groupStoresByCoordinate = (stores: StoreLocation[]) => {
  const storeGroups = new Map<string, StoreMarkerGroupEntry[]>();

  stores.forEach((store, index) => {
    const coordinateKey = `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`;
    const group = storeGroups.get(coordinateKey) ?? [];

    group.push({ index, store });
    storeGroups.set(coordinateKey, group);
  });

  return Array.from(storeGroups.values());
};

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

/**
 * 매장 핀을 지도 위 overlay로 올리고, 클릭(단일 선택·묶음 목록 열기/닫기)·hover 이벤트를 연결한다.
 * 매장 선택 시 처리(최신 state 반영, 카드 초기화 등)는 호출하는 effect가 콜백으로 넘긴다.
 */
export const createStoreMarkerOverlay = ({
  group,
  isStoreCardShown,
  kakaoMaps,
  map,
  markerColorInfoById,
  markerLabelById,
  selectedStoreId,
  shouldAnimateEnter,
  onMarkerClick,
  onSelectClusterStore,
  onSelectStore,
}: {
  group: StoreMarkerGroupEntry[];
  isStoreCardShown: boolean;
  kakaoMaps: KakaoMapsApi;
  map: KakaoMap;
  markerColorInfoById?: Record<string, MarkerColorInfo>;
  markerLabelById?: Record<string, string>;
  selectedStoreId: string;
  shouldAnimateEnter: boolean;
  /** 핀을 누를 때마다(단일·묶음 공통) 호출한다. */
  onMarkerClick: () => void;
  /** 묶음 핀의 목록에서 매장을 골랐을 때 */
  onSelectClusterStore: (storeId: string) => void;
  /** 단일 핀을 눌러 매장을 골랐을 때 */
  onSelectStore: (storeId: string) => void;
}): MapOverlayHandle => {
  const [{ store: firstStore }] = group;
  const isCluster = group.length > 1;
  const selectedEntry = group.find(({ store }) => store.id === selectedStoreId);
  const isSelected = Boolean(selectedEntry);
  const getLabel = ({ index, store }: StoreMarkerGroupEntry) =>
    markerLabelById?.[store.id] ?? getStoreMarkerLabel(index);
  const colorTargetStore = selectedEntry?.store ?? firstStore;
  const { container, marker } = createStoreMarkerElement({
    getLabel,
    group,
    isStoreCardShown,
    markerColorInfo: markerColorInfoById?.[colorTargetStore.id],
    selectedEntry,
    shouldAnimateEnter,
  });

  let clusterList: HTMLDivElement | null = null;
  const closeClusterList = () => {
    clusterList?.remove();
    clusterList = null;
    marker.setAttribute("aria-expanded", "false");
  };
  const handleDocumentPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Node && container.contains(event.target)) {
      return;
    }

    closeClusterList();
  };
  const openClusterList = () => {
    clusterList = createClusterListElement({
      getLabel,
      group,
      onSelect: (entry, event) => {
        event.stopPropagation();
        closeClusterList();
        onSelectClusterStore(entry.store.id);
      },
      selectedStoreId,
    });
    container.append(clusterList);
    marker.setAttribute("aria-expanded", "true");
  };
  const handleMarkerClick = (event: MouseEvent) => {
    event.stopPropagation();
    onMarkerClick();

    if (!isCluster) {
      onSelectStore(firstStore.id);
      return;
    }

    if (clusterList) {
      closeClusterList();
    } else {
      openClusterList();
    }
  };

  const baseZIndex = isSelected ? 20 : 10;
  const overlay = new kakaoMaps.CustomOverlay({
    content: container,
    map,
    position: new kakaoMaps.LatLng(firstStore.lat, firstStore.lng),
    xAnchor: 0.5,
    yAnchor: 1,
    zIndex: baseZIndex,
  });
  // hover 중인 핀의 툴팁(매장명)·묶음 목록이 이웃 핀 뒤로 가려지지 않도록 최상단으로 올린다.
  const handleMarkerEnter = () => overlay.setZIndex?.(40);
  const handleMarkerLeave = () => {
    if (!clusterList) {
      overlay.setZIndex?.(baseZIndex);
    }
  };

  marker.addEventListener("click", handleMarkerClick);
  container.addEventListener("mouseenter", handleMarkerEnter);
  container.addEventListener("mouseleave", handleMarkerLeave);
  document.addEventListener("pointerdown", handleDocumentPointerDown);

  return {
    cleanup: () => {
      closeClusterList();
      marker.removeEventListener("click", handleMarkerClick);
      container.removeEventListener("mouseenter", handleMarkerEnter);
      container.removeEventListener("mouseleave", handleMarkerLeave);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    },
    overlay,
  };
};

/** 내 위치 표시 overlay를 만든다. */
export const createCurrentLocationOverlay = ({
  kakaoMaps,
  map,
  userLocation,
}: {
  kakaoMaps: KakaoMapsApi;
  map: KakaoMap;
  userLocation: UserLocation;
}): MapOverlayHandle => {
  const currentLocationMarker = document.createElement("div");
  currentLocationMarker.className = "vita-current-location-marker";
  currentLocationMarker.setAttribute("aria-label", "내 위치");

  return {
    overlay: new kakaoMaps.CustomOverlay({
      content: currentLocationMarker,
      map,
      position: new kakaoMaps.LatLng(userLocation.lat, userLocation.lng),
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 30,
    }),
  };
};

/** 경로 위 한 지점(출발·도착·환승·진행 지점)에 표시 DOM을 올린다. */
export const createRoutePointOverlay = ({
  content,
  kakaoMaps,
  map,
  point,
  yAnchor = 0.5,
  zIndex,
}: {
  content: HTMLElement;
  kakaoMaps: KakaoMapsApi;
  map: KakaoMap;
  point: MapPoint;
  yAnchor?: number;
  zIndex: number;
}) =>
  new kakaoMaps.CustomOverlay({
    content,
    map,
    position: new kakaoMaps.LatLng(point.lat, point.lng),
    xAnchor: 0.5,
    yAnchor,
    zIndex,
  });

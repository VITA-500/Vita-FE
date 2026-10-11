import type { UserLocation } from "@/features/store/lib/geo";
import type {
  KakaoMapsApi,
  MapOverlayHandle,
  StoreMarkerGroupEntry,
} from "@/features/store/lib/kakaoMapTypes";
import type { MapPoint } from "@/features/store/lib/mapFit";
import { createClusterListElement } from "@/features/store/lib/mapOverlayElements";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import { createStoreMarkerElement } from "@/features/store/lib/storeMarkerElement";
import type { StoreLocation } from "@/features/store/types";

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

  // 핀을 누르는 순간 카카오맵이 지도 드래그를 시작하면, 손이 살짝만 움직여도 dragend가 나서
  // 정보 카드가 닫히거나 핀이 다시 그려져 첫 클릭이 사라진다(두 번 눌러야 카드가 뜨던 원인).
  // 핀(과 묶음 목록) 위에서 시작한 입력은 지도에 넘기지 않는다.
  const handleMarkerPressStart = () => {
    kakaoMaps.event.preventMap?.();
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

  container.addEventListener("mousedown", handleMarkerPressStart);
  container.addEventListener("touchstart", handleMarkerPressStart, {
    passive: true,
  });
  marker.addEventListener("click", handleMarkerClick);
  container.addEventListener("mouseenter", handleMarkerEnter);
  container.addEventListener("mouseleave", handleMarkerLeave);
  document.addEventListener("pointerdown", handleDocumentPointerDown);

  return {
    cleanup: () => {
      closeClusterList();
      container.removeEventListener("mousedown", handleMarkerPressStart);
      container.removeEventListener("touchstart", handleMarkerPressStart);
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

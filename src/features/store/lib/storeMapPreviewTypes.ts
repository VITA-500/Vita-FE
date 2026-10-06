import type {
  CSSProperties,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import type { UserLocation } from "@/features/store/lib/geo";
import type { MapOverlayHandle } from "@/features/store/lib/kakaoMapTypes";
import type { MapFitPadding, MapPoint } from "@/features/store/lib/mapFit";
import type { RoutePreview } from "@/features/store/lib/mapRoute";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import type { StoreLocation } from "@/features/store/types";

export type StoreMapPreviewProps = {
  className?: string;
  /** 채팅 답변 안처럼 낮은 지도. 최소 높이를 두지 않고 컨트롤을 모서리에 붙여 모두 보이게 한다. */
  isCompact?: boolean;
  isFullBleed?: boolean;
  /** 길찾기 중 도착 매장 카드인지. 데스크톱에서는 지도 조작(드래그·확대/축소·클릭)으로 닫히지 않는다. */
  isRouteCardDocked?: boolean;
  focusPoint?: MapPoint | null;
  isSearchFromMapPointLoading?: boolean;
  selectedStore?: StoreLocation;
  selectedStoreCard?: ReactNode;
  selectedStoreCardLeftInset?: number;
  /** 길찾기 경로를 맞출 때 비워 둘 왼쪽 폭(검색/매장 목록 패널 영역, px). */
  routeLeftInset?: number;
  selectedStoreId: string;
  stores: StoreLocation[];
  searchPoint?: MapPoint | null;
  routePreview?: RoutePreview | null;
  userLocation?: UserLocation | null;
  isUserLocationLoading?: boolean;
  onMapPointSelect?: (point: MapPoint) => void;
  /** 지도 이동·확대/축소가 끝날 때마다 현재 지도 중심을 알려준다. */
  onCenterChange?: (point: MapPoint) => void;
  /** 지도 이동·확대/축소가 끝날 때마다 지금 보이는 지도 영역(중심·남서·북동 모서리)을 알려준다. */
  onViewportChange?: (viewport: {
    center: MapPoint;
    northEast: MapPoint;
    southWest: MapPoint;
  }) => void;
  /** 매장 id별 핀 글자. 없으면 stores 순서대로 A, B, C… */
  markerLabelById?: Record<string, string>;
  /** 매장 id별 핀 색상 정보. 선택된 서비스 필터가 있으면 색 분할·추가 개수를 반영한다. */
  markerColorInfoById?: Record<string, MarkerColorInfo>;
  /** 핀(현재 페이지) 외 나머지 매장. 핀 대신 반투명 원으로 위치만 표시한다. */
  otherStores?: StoreLocation[];
  /** 핀 외 나머지 매장 수. 0보다 크면 "나머지 매장 보기" 버튼을 보여준다. */
  otherStoreCount?: number;
  isOtherStoresVisible?: boolean;
  onToggleOtherStores?: () => void;
  /** 길찾기 경로를 가릴 수 있는 지도 위 패널(매장 목록)의 화면 영역. 없으면 null */
  getRouteObstacleRect?: () => DOMRect | null;
  /** 경로·출발/도착 지점·정보 카드가 위 패널에 가려졌을 때 호출 */
  onRouteObstructed?: () => void;
  /** key가 바뀔 때마다 points가 모두 보이도록 지도 범위를 맞춘다(검색 결과 표시용). */
  /** smooth: 순간 이동 대신 부드럽게 이동(panTo)하고, 모자라면 애니메이션으로 축소한다(페이지 전환용). */
  fitTarget?: { key: string; points: MapPoint[]; smooth?: boolean } | null;
  /** 값이 바뀌면 이번에 그리는 핀·원을 서서히 나타나게 한다(페이지 전환용). */
  markerEnterKey?: string;
  /**
   * 핀을 둘 때 비워 둘 여백(검색창·매장 목록 패널 등에 가리는 영역, 지도 컨테이너 기준 px).
   * 목록이 펼쳐졌는지에 따라 달라지므로 호출 시점에 잰다. 없으면 기본 여백.
   */
  getPinFitPadding?: (container: {
    height: number;
    width: number;
  }) => MapFitPadding | null;
  /** 값이 바뀌면(새 핀 묶음, 목록 펼침/접힘) 가장 바깥 핀까지 가리지 않고 보이는지 확인하고, 아니면 지도를 옮긴다. */
  pinAutoFitKey?: string;
  /** true면 자동 맞춤을 하지 않는다(정보 카드·길찾기 중 등). */
  isPinAutoFitPaused?: boolean;
  /** 자동 맞춤 직전에 호출해 true면 이번 맞춤을 건너뛴다(필터 해제 직후 보던 화면 유지 등). */
  shouldSkipPinAutoFit?: () => boolean;
  onFocusUserLocation?: () => void;
  onSelectedStoreCardClose?: () => void;
  onSearchFromMapPoint?: () => void;
  onSelectStore: (storeId: string) => void;
  /** 길찾기: 출발-경로-도착이 보이도록 지도 범위를 맞추고(이동 완료) 경로를 그리기 시작할 때, 그 경로 key */
  onRouteMapReady?: (routeKey: string) => void;
};

/**
 * 지도 메인 effect(지도 생성·카드 위치·지도 이벤트·핀 그리기)가 한 번 실행될 때 쓰는 값.
 * effect 안에서 만들어 storeMapCamera / storeMapCardController / storeMapEvents / storeMapMarkers 함수에 넘긴다.
 */
export type StoreMapEffectContext = Pick<
  StoreMapPreviewProps,
  | "focusPoint"
  | "getRouteObstacleRect"
  | "markerColorInfoById"
  | "markerLabelById"
  | "onCenterChange"
  | "onMapPointSelect"
  | "onRouteObstructed"
  | "onSelectedStoreCardClose"
  | "onSelectStore"
  | "onViewportChange"
  | "routePreview"
  | "searchPoint"
  | "selectedStore"
  | "selectedStoreCard"
  | "selectedStoreId"
  | "stores"
  | "userLocation"
> & {
  animatedMarkerEnterKeyRef: RefObject<string>;
  autoFitCardAfterZoomRef: RefObject<boolean>;
  ensuredCardStoreIdRef: RefObject<string>;
  fittedRouteKeyRef: RefObject<string>;
  focusPointRef: RefObject<MapPoint | null | undefined>;
  isKakaoMapReady: boolean;
  isRouteCardDocked: boolean;
  isRouteCardHeld: boolean;
  lastMarkerClickAtRef: RefObject<number>;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<KakaoMap | null>;
  markerEnterKey: string;
  markRouteFitReadyRef: RefObject<(routeKey: string) => void>;
  overlayRefs: RefObject<MapOverlayHandle[]>;
  pendingRevealStoreIdRef: RefObject<string>;
  pendingRouteFitKeyRef: RefObject<string>;
  revealedCardStoreId: string;
  revealFallbackTimeoutRef: RefObject<number | undefined>;
  routeFitFallbackTimeoutRef: RefObject<number | undefined>;
  routeLeftInset: number;
  routePreviewRef: RefObject<RoutePreview | null | undefined>;
  searchPointRef: RefObject<MapPoint | null | undefined>;
  selectedStoreCardLeftInset: number;
  selectedStoreCardRef: RefObject<HTMLDivElement | null>;
  setIsMapFirstPainted: Dispatch<SetStateAction<boolean>>;
  setRevealedCardStoreId: Dispatch<SetStateAction<string>>;
  setSelectedStoreCardPosition: Dispatch<SetStateAction<CSSProperties | null>>;
};

/** 지도가 만들어진 뒤에 쓰는 값(카카오맵 SDK와 지도 인스턴스) */
export type StoreMapInstance = {
  kakaoMaps: NonNullable<NonNullable<Window["kakao"]>["maps"]>;
  map: KakaoMap;
};

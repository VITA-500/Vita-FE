/**
 * 매장 정보 카드 위치 계산 공통 값.
 * - 선택 매장으로 지도 중심을 옮길 때와, 카드가 지도 위쪽 밖으로 나가지 않게 막을 때 같은 값을 쓴다.
 * - 위쪽 여백은 좌측 상단 검색창 영역(데스크톱: 위 20px + 높이 48px, 모바일: 상단 여백 포함 약 124px)을 피하는 높이다.
 */
const STORE_CARD_TOP_INSET_DESKTOP = 80;
const STORE_CARD_TOP_INSET_MOBILE = 140;
/** 카드가 아직 그려지지 않아 높이를 잴 수 없을 때 쓰는 추정 높이 */
const STORE_CARD_ESTIMATED_HEIGHT = 320;
/**
 * 카드 아래쪽과 핀 끝(좌표 지점) 사이 간격.
 * 핀 높이 46px + 선택 시 떠오르는 10px + 여유 8px -> 카드가 핀 머리를 가리지 않는다.
 * (카드의 -translate-y-[calc(100%+64px)]와 같은 값)
 */
export const STORE_CARD_MARKER_GAP = 64;

/** 확대/축소 애니메이션 시간(ms). 확대/축소 버튼과 페이지 전환 범위 맞춤이 같이 쓴다. */
export const ZOOM_ANIMATION_MS = 320;

export type MapPoint = {
  lat: number;
  lng: number;
};

export type MapFitPadding = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type KakaoMapProjection = {
  containerPointFromCoords?: (latlng: KakaoLatLng) => {
    x: number;
    y: number;
  };
};

export type KakaoMapWithProjection = KakaoMap & {
  getProjection?: () => KakaoMapProjection;
};

export const getStoreCardTopInset = (containerWidth: number) =>
  containerWidth >= 768
    ? STORE_CARD_TOP_INSET_DESKTOP
    : STORE_CARD_TOP_INSET_MOBILE;

export const getStoreCardHeight = (
  card: HTMLElement | null,
  estimatedHeight = STORE_CARD_ESTIMATED_HEIGHT,
) => card?.getBoundingClientRect().height || estimatedHeight;

/**
 * point가 지도 컨테이너의 (targetX, targetY) 픽셀 위치에 오도록 하는 지도 중심 좌표를 구한다.
 * 현재 확대 수준의 픽셀-위경도 비율을 projection으로 재서 계산한다(짧은 거리에서는 선형 근사로 충분).
 */
export const getCenterPlacingPointAt = (
  map: KakaoMap,
  point: MapPoint,
  target: { x: number; y: number },
  container: { width: number; height: number },
) => {
  const kakaoMaps = window.kakao?.maps;
  const projection = (map as KakaoMapWithProjection).getProjection?.();

  if (!kakaoMaps || !projection?.containerPointFromCoords) {
    return null;
  }

  const deltaDegree = 0.001;
  const basePoint = projection.containerPointFromCoords(
    new kakaoMaps.LatLng(point.lat, point.lng),
  );
  const offsetPoint = projection.containerPointFromCoords(
    new kakaoMaps.LatLng(point.lat + deltaDegree, point.lng + deltaDegree),
  );
  const pxPerLat = (basePoint.y - offsetPoint.y) / deltaDegree;
  const pxPerLng = (offsetPoint.x - basePoint.x) / deltaDegree;

  if (!(pxPerLat > 0) || !(pxPerLng > 0)) {
    return null;
  }

  const dx = target.x - container.width / 2;
  const dy = target.y - container.height / 2;

  return new kakaoMaps.LatLng(
    point.lat + dy / pxPerLat,
    point.lng - dx / pxPerLng,
  );
};

/**
 * 길찾기 경로를 화면에 맞출 때 비워 둘 여백(왼쪽 패널·위쪽 카드·오른쪽 컨트롤 영역).
 * 컴포넌트 밖 순수 함수로 두어, 렌더·effect 어디서 불러도 선언 순서·의존성 문제가 없게 한다.
 */
export const getRouteFitPadding = ({
  cardElement,
  containerWidth,
  hasStoreCard,
  routeLeftInset,
  selectedStoreCardLeftInset,
}: {
  cardElement: HTMLElement | null;
  containerWidth: number;
  hasStoreCard: boolean;
  routeLeftInset: number;
  selectedStoreCardLeftInset: number;
}) => ({
  bottom: 96,
  left:
    containerWidth >= 768
      ? Math.max(
          48,
          selectedStoreCardLeftInset ? selectedStoreCardLeftInset + 24 : 0,
          // 출발-경로-도착이 왼쪽 매장 목록 패널 아래로 가려지지 않도록 패널 폭만큼 비운다.
          routeLeftInset ? routeLeftInset + 32 : 0,
        )
      : 48,
  right: 72,
  // 길찾기 카드는 도착 매장 핀 위에 붙어 뜨므로, 위쪽에 카드가 들어갈 자리를 남긴다.
  top: hasStoreCard
    ? getStoreCardTopInset(containerWidth) +
      getStoreCardHeight(cardElement, 240) +
      STORE_CARD_MARKER_GAP
    : 160,
});

/** 핀이 들어갈 기본 여백: 위 검색창·핀 높이, 오른쪽 지도 컨트롤, 왼쪽 매장 목록 패널 */
export const getDefaultPinFitPadding = (
  containerWidth: number,
  routeLeftInset: number,
): MapFitPadding => ({
  bottom: 72,
  left: containerWidth >= 768 ? Math.max(48, routeLeftInset + 32) : 48,
  right: 96,
  top: 120,
});

/** 좌표들을 지도 컨테이너 기준 화면 좌표로 바꾼다. 투영 정보가 없으면 null */
export const getScreenPoints = (map: KakaoMap, points: MapPoint[]) => {
  const kakaoMaps = window.kakao?.maps;
  const projection = (map as KakaoMapWithProjection).getProjection?.();

  if (!kakaoMaps || !projection?.containerPointFromCoords) {
    return null;
  }

  return points.map((point) =>
    projection.containerPointFromCoords!(
      new kakaoMaps.LatLng(point.lat, point.lng),
    ),
  );
};

/** 모든 좌표가 여백을 뺀 영역(패널·검색창에 가리지 않는 곳) 안에 있는지 */
export const arePointsInFreeArea = (
  map: KakaoMap,
  points: MapPoint[],
  container: { height: number; width: number },
  padding: MapFitPadding,
) => {
  const screenPoints = getScreenPoints(map, points);

  if (!screenPoints) {
    return true;
  }

  return screenPoints.every(
    (point) =>
      point.x >= padding.left &&
      point.x <= container.width - padding.right &&
      point.y >= padding.top &&
      point.y <= container.height - padding.bottom,
  );
};

/**
 * 점들이 모두 보이도록 지도를 부드럽게 옮긴다.
 * 1) 핀이 들어갈 영역(여백 제외)의 가운데로 panTo  2) 그래도 넘치면 이동 후 필요한 만큼만 애니메이션 축소.
 * 계산할 수 없으면 false(호출한 쪽에서 setBounds 등으로 처리). 축소 예약 타이머 id를 onZoomScheduled로 넘긴다.
 */
export const fitPointsSmoothlyOnMap = (
  map: KakaoMap,
  points: MapPoint[],
  container: { height: number; width: number },
  padding: MapFitPadding,
  zoomAnimationMs: number,
  onZoomScheduled: (timeoutId: number) => void,
) => {
  const kakaoMaps = window.kakao?.maps;
  const screenPoints = getScreenPoints(map, points);

  if (!kakaoMaps || !map.panTo || !screenPoints || points.length === 0) {
    return false;
  }

  const freeWidth = container.width - padding.left - padding.right;
  const freeHeight = container.height - padding.top - padding.bottom;

  if (freeWidth <= 0 || freeHeight <= 0) {
    return false;
  }

  const spanX =
    Math.max(...screenPoints.map((point) => point.x)) -
    Math.min(...screenPoints.map((point) => point.x));
  const spanY =
    Math.max(...screenPoints.map((point) => point.y)) -
    Math.min(...screenPoints.map((point) => point.y));
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const pointsCenter = {
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
  const nextCenter = getCenterPlacingPointAt(
    map,
    pointsCenter,
    { x: padding.left + freeWidth / 2, y: padding.top + freeHeight / 2 },
    container,
  );

  if (!nextCenter) {
    return false;
  }

  map.panTo(nextCenter);

  // 현재 확대 수준에서 다 들어가지 않으면, 이동이 끝난 뒤 필요한 단계만큼 부드럽게 축소한다.
  const overflowRatio = Math.max(spanX / freeWidth, spanY / freeHeight);

  if (overflowRatio > 1) {
    const zoomOutLevels = Math.ceil(Math.log2(overflowRatio));

    onZoomScheduled(
      window.setTimeout(() => {
        map.setLevel(map.getLevel() + zoomOutLevels, {
          anchor: new kakaoMaps.LatLng(pointsCenter.lat, pointsCenter.lng),
          animate: { duration: zoomAnimationMs },
        });
      }, zoomAnimationMs),
    );
  }

  return true;
};

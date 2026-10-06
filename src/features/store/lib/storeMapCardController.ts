import {
  getCenterPlacingPointAt,
  getStoreCardHeight,
  getStoreCardTopInset,
  STORE_CARD_MARKER_GAP,
  type KakaoMapWithProjection,
} from "@/features/store/lib/mapFit";
import type {
  StoreMapEffectContext,
  StoreMapInstance,
} from "@/features/store/lib/storeMapPreviewTypes";

/** 초점 이동 완료(idle) 신호가 오지 않을 때 카드를 보여주기까지 기다리는 최대 시간(ms) */
const CARD_REVEAL_FALLBACK_MS = 700;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * 선택 매장 정보 카드 위치 계산과 자리 확보.
 * 카드는 항상 선택 핀 바로 위에 붙고, 카드가 들어갈 자리가 없으면 지도를 부드럽게 밀어 자리를 만든 뒤 보여준다.
 */
export const createSelectedStoreCardController = ({
  ensuredCardStoreIdRef,
  isRouteCardHeld,
  kakaoMaps,
  map,
  mapContainerRef,
  pendingRevealStoreIdRef,
  revealFallbackTimeoutRef,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLeftInset,
  selectedStoreCardRef,
  setRevealedCardStoreId,
  setSelectedStoreCardPosition,
}: StoreMapEffectContext & StoreMapInstance) => {
  /** 선택 매장 핀의 화면 좌표와, 카드가 핀 바로 위에 온전히 들어갈 수 있는 핀 위치 범위 */
  const getSelectedStoreCardLayout = () => {
    if (!selectedStore || !mapContainerRef.current) {
      return null;
    }

    const projection = (map as KakaoMapWithProjection).getProjection?.();
    const point = projection?.containerPointFromCoords?.(
      new kakaoMaps.LatLng(selectedStore.lat, selectedStore.lng),
    );

    if (!point) {
      return null;
    }

    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const effectiveLeftInset =
      containerRect.width >= 768 ? selectedStoreCardLeftInset : 0;
    const availableWidth = containerRect.width - effectiveLeftInset - 24;
    const cardWidth = Math.min(320, Math.max(0, availableWidth));
    const cardHeight = getStoreCardHeight(selectedStoreCardRef.current);
    const horizontalPadding = 12;
    const bottomPadding = 12;
    const minX = effectiveLeftInset + horizontalPadding + cardWidth / 2;
    const maxX = containerRect.width - horizontalPadding - cardWidth / 2;
    const maxY = containerRect.height - bottomPadding;
    const minY = Math.min(
      getStoreCardTopInset(containerRect.width) +
        cardHeight +
        STORE_CARD_MARKER_GAP,
      maxY,
    );

    return {
      containerRect,
      maxX: Math.max(minX, maxX),
      maxY,
      minX: Math.min(minX, maxX),
      minY,
      point,
    };
  };
  const updateSelectedStoreCardPosition = () => {
    const layout = getSelectedStoreCardLayout();

    if (!layout) {
      setSelectedStoreCardPosition(null);
      return;
    }

    const { containerRect, point } = layout;

    // 핀이 화면 밖으로 나가면(확대/축소·드래그로) 카드도 숨긴다.
    // 카드만 화면 가장자리에 붕 떠 있지 않도록 하기 위함. 핀이 다시 들어오면 자동으로 다시 뜬다.
    const isPinVisible =
      point.x >= 0 &&
      point.x <= containerRect.width &&
      point.y >= 0 &&
      point.y <= containerRect.height;

    if (!isPinVisible) {
      setSelectedStoreCardPosition(null);
      return;
    }

    // 카드는 항상 핀 바로 위에 붙어 있다(핀에서 떨어지지 않도록 위치를 제한하지 않는다).
    // 카드가 화면·왼쪽 패널 밖으로 빠져나가는 경우는 panToFitSelectedCard가 지도를 살짝 밀어 해결한다.
    setSelectedStoreCardPosition({
      left: `${point.x}px`,
      top: `${point.y}px`,
    });
  };
  /** 카드가 핀 위에 온전히 들어가는지 */
  const isSelectedCardInView = (
    layout: NonNullable<ReturnType<typeof getSelectedStoreCardLayout>>,
  ) =>
    layout.point.x >= layout.minX &&
    layout.point.x <= layout.maxX &&
    layout.point.y >= layout.minY &&
    layout.point.y <= layout.maxY;
  /**
   * 카드가 핀 위에 온전히 들어가도록 필요한 만큼만 지도를 부드럽게 민다.
   * (위쪽 핀은 카드 높이만큼 아래로, 가장자리·왼쪽 패널 쪽 핀은 안쪽으로) 옮겼으면 true.
   */
  const panToFitSelectedCard = (
    layout: NonNullable<ReturnType<typeof getSelectedStoreCardLayout>>,
  ) => {
    if (!selectedStore || !map.panTo) {
      return false;
    }

    const { containerRect, maxX, maxY, minX, minY, point } = layout;
    const nextCenter = getCenterPlacingPointAt(
      map,
      selectedStore,
      {
        x: clampValue(point.x, minX, maxX),
        y: clampValue(point.y, Math.min(minY + 12, maxY), maxY),
      },
      { height: containerRect.height, width: containerRect.width },
    );

    if (!nextCenter) {
      return false;
    }

    map.panTo(nextCenter);

    return true;
  };
  /**
   * 매장을 새로 고르면, 핀 위에 카드가 들어갈 자리가 없을 때(화면 위쪽·가장자리 핀)
   * 핀이 가려지지 않고 카드 높이만큼 여유가 생기도록 지도 초점을 부드럽게 옮긴다.
   */
  const ensureSelectedStoreInView = () => {
    if (!selectedStore || !selectedStoreCard) {
      return;
    }

    // 길찾기 경로를 그리는 동안에는 카드 자리 확보를 위해 지도를 옮기지 않는다(경로 범위 맞춤 유지).
    if (isRouteCardHeld) {
      return;
    }

    if (ensuredCardStoreIdRef.current === selectedStore.id) {
      return;
    }

    const layout = getSelectedStoreCardLayout();

    if (!layout) {
      return;
    }

    ensuredCardStoreIdRef.current = selectedStore.id;

    // 카드 자리가 이미 있으면 바로 보여준다.
    if (isSelectedCardInView(layout)) {
      setRevealedCardStoreId(selectedStore.id);
      return;
    }

    // 지도를 먼저 부드럽게 옮겨 카드 자리를 확보한 뒤(idle), 카드를 보여준다.
    setRevealedCardStoreId("");
    pendingRevealStoreIdRef.current = selectedStore.id;

    if (!panToFitSelectedCard(layout)) {
      revealPendingCard();
      return;
    }

    window.clearTimeout(revealFallbackTimeoutRef.current);
    revealFallbackTimeoutRef.current = window.setTimeout(() => {
      revealPendingCard();
    }, CARD_REVEAL_FALLBACK_MS);
  };
  /** 초점 이동이 끝나면 보류해 둔 카드를 보여준다. */
  const revealPendingCard = () => {
    const pendingStoreId = pendingRevealStoreIdRef.current;

    if (!pendingStoreId) {
      return;
    }

    pendingRevealStoreIdRef.current = "";
    window.clearTimeout(revealFallbackTimeoutRef.current);
    setRevealedCardStoreId(pendingStoreId);
    updateSelectedStoreCardPosition();
  };

  return {
    ensureSelectedStoreInView,
    getSelectedStoreCardLayout,
    isSelectedCardInView,
    panToFitSelectedCard,
    revealPendingCard,
    updateSelectedStoreCardPosition,
  };
};

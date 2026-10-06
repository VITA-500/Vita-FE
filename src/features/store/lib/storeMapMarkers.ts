import {
  createCurrentLocationOverlay,
  createStoreMarkerOverlay,
  groupStoresByCoordinate,
} from "@/features/store/lib/storeMarkerOverlays";
import type {
  StoreMapEffectContext,
  StoreMapInstance,
} from "@/features/store/lib/storeMapPreviewTypes";

/** 이전 핀을 지우고 매장 핀(같은 좌표는 묶음 핀)과 내 위치 표시를 다시 그린다. */
export const drawStoreMarkers = ({
  animatedMarkerEnterKeyRef,
  kakaoMaps,
  lastMarkerClickAtRef,
  map,
  markerColorInfoById,
  markerEnterKey,
  markerLabelById,
  onSelectStore,
  overlayRefs,
  selectedStore,
  selectedStoreCard,
  selectedStoreId,
  setRevealedCardStoreId,
  stores,
  userLocation,
}: StoreMapEffectContext & StoreMapInstance) => {
  overlayRefs.current.forEach(({ cleanup, overlay }) => {
    cleanup?.();
    overlay.setMap(null);
  });
  // 같은 좌표(소수 5자리, 약 1m)에 있는 매장들은 핀 하나로 묶고 개수를 표시한다.
  // 핀을 누르면 묶인 매장 목록이 떠서 그중 하나를 고를 수 있다.
  const storeGroups = groupStoresByCoordinate(stores);

  const isStoreCardShown = Boolean(selectedStore && selectedStoreCard);
  // 페이지가 바뀐 뒤 처음 그릴 때만 핀이 서서히 나타나게 한다(매장 선택 등으로 다시 그릴 때는 그대로).
  const shouldAnimateMarkerEnter =
    Boolean(markerEnterKey) &&
    animatedMarkerEnterKeyRef.current !== markerEnterKey;

  animatedMarkerEnterKeyRef.current = markerEnterKey;

  overlayRefs.current = storeGroups.map((group) =>
    createStoreMarkerOverlay({
      group,
      isStoreCardShown,
      kakaoMaps,
      map,
      markerColorInfoById,
      markerLabelById,
      selectedStoreId,
      shouldAnimateEnter: shouldAnimateMarkerEnter,
      onMarkerClick: () => {
        lastMarkerClickAtRef.current = Date.now();
      },
      onSelectStore: (storeId) => {
        // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
        if (storeId !== selectedStoreId) {
          setRevealedCardStoreId("");
        }
        onSelectStore(storeId);
      },
      onSelectClusterStore: (storeId) => {
        setRevealedCardStoreId("");
        // 다른 매장을 고르면 초점 이동 후에 카드를 보여준다(같은 매장을 다시 누르면 그대로 둠).
        if (storeId !== selectedStoreId) {
          setRevealedCardStoreId("");
        }
        onSelectStore(storeId);
      },
    }),
  );

  if (userLocation) {
    overlayRefs.current.push(
      createCurrentLocationOverlay({ kakaoMaps, map, userLocation }),
    );
  }
};

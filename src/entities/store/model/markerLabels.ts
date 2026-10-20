import type { StoreLocation } from "@/entities/store/model/types";

/** 매장 핀·목록·카드에 쓰는 글자(A, B, C…). 26개를 넘으면 다시 A부터 */
export const getStoreMarkerLabel = (index: number) =>
  String.fromCharCode(65 + (index % 26));

/** 지금 페이지 핀의 글자(A, B, C…). 다른 페이지에서 골라 함께 보여주는 매장 핀은 "•" */
export const buildMarkerLabelById = (
  pagedMapStores: StoreLocation[],
  selectedStoreOutsidePage?: StoreLocation,
) => {
  const markerLabelById: Record<string, string> = Object.fromEntries(
    pagedMapStores.map((store, index) => [
      store.id,
      getStoreMarkerLabel(index),
    ]),
  );

  if (selectedStoreOutsidePage) {
    markerLabelById[selectedStoreOutsidePage.id] = "•";
  }

  return markerLabelById;
};

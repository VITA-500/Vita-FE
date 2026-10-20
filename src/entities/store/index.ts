// 매장 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
export { isApiStoreId, storeApi } from "@/entities/store/api/storeApi";
export { adminStoreApi } from "@/entities/store/api/admin";
export {
  nearbyStoresQueryOptions,
  storeDetailQueryOptions,
  storeQueryKeys,
  useBenefitStoresQuery,
  useFetchNearbyStores,
  useFetchStoreDetail,
} from "@/entities/store/model/queries";
export {
  ALL_STORE_OPEN_FILTER,
  filterStoresByOpenFilter,
  formatTimeValue,
  getCurrentOpenState,
  getCurrentOpenStatus,
  getNextOpenFilterTime,
  getOpenFilterKey,
  getOpenFilterLabel,
  isOpenAtTime,
  OPEN_FILTER_TIME_OPTIONS,
  toOpenFilterParams,
  type StoreOpenStatus,
} from "@/entities/store/model/storeOpenHours";
export { matchesStoreSearch } from "@/entities/store/model/storeSearch";
export {
  getKakaoDirectionUrl,
  getStoreMapRouteUrl,
} from "@/entities/store/model/mapLinks";
export {
  buildMarkerLabelById,
  getStoreMarkerLabel,
} from "@/entities/store/model/markerLabels";
export {
  buildMarkerColorInfoById,
  buildServiceFilterColorByValue,
  buildStoreServiceColorByValue,
  getServiceFilterBadgeStyle,
  getServiceFilterColor,
  serviceFilterColors,
  type MarkerColorInfo,
  type ServiceFilterOption,
} from "@/entities/store/model/markerColors";
export {
  findServicesInText,
  KNOWN_CONSULT_SERVICES,
  KNOWN_PROVIDED_SERVICES,
} from "@/entities/store/model/serviceKeywords";
export { StoreOpenStatusBadge } from "@/entities/store/ui/StoreOpenStatusBadge";
export type {
  AdminStore,
  AdminStoreDetail,
  AdminStoreFormInput,
  AdminStoreRequest,
  AdminStoreType,
  StoreLocation,
  StoreOpenFilter,
  StoreType,
} from "@/entities/store/model/types";

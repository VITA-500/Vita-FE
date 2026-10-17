import type {
  MapSearchPoint,
  MapViewport,
} from "@/features/store/lib/storePanelStores";
import type {
  MapCategory,
  StoreLocation,
  StoreOpenFilter,
} from "@/features/store/types";
import {
  readJsonStorage,
  removeStorage,
  writeJsonStorage,
} from "@/shared/lib/browserStorage";

/**
 * 매장 지도에서 로그인하러 갈 때 지금 보던 화면을 잠깐 보관했다가, 로그인 후 지도로 돌아오면 그대로 되살린다.
 * (로그인 화면으로 가면 지도 화면이 사라져 검색·필터·지도 위치·고른 매장이 모두 초기화되기 때문)
 * 같은 탭에서만 쓰도록 sessionStorage에 두고, 한 번 되살리면 지운다.
 */
const STORE_MAP_SNAPSHOT_STORAGE_KEY = "vita-store-map-snapshot";
const STORE_MAP_SNAPSHOT_VERSION = 1;
/** 이 시간이 지난 기록은 버린다(로그인을 하다 말고 한참 뒤에 지도에 들어온 경우). */
const STORE_MAP_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000;

/** 로그인 후 돌아올 매장 지도 주소(매장 선택·길찾기 같은 일회성 동작 없이 지도만 연다). */
export const STORE_MAP_RETURN_PATH = "/chat?mode=store";

export type StoreMapSnapshot = {
  version: typeof STORE_MAP_SNAPSHOT_VERSION;
  savedAt: number;
  activeMapCategory: MapCategory;
  allStores: StoreLocation[];
  consultServiceFilters: string[];
  hasSelectedStoreInfo: boolean;
  isStoreListCollapsed: boolean;
  mapViewport: MapViewport | null;
  openFilter: StoreOpenFilter;
  /** 로그인 전에 예약하려던 매장. 로그인하고 돌아오면 예약을 이어서 연다. */
  pendingReservationStore: StoreLocation | null;
  providedServiceFilters: string[];
  searchAnchorSource: "user" | "map";
  searchQuery: string;
  selectedBenefitCategory: string;
  selectedStoreId: string;
  soloStoreId: string;
  stores: StoreLocation[];
  storesOrigin: MapSearchPoint | null;
  submittedSearchOrigin: MapSearchPoint | null;
  submittedSearchStores: StoreLocation[] | null;
};

export type StoreMapSnapshotInput = Omit<
  StoreMapSnapshot,
  "savedAt" | "version"
>;

export const saveStoreMapSnapshot = (input: StoreMapSnapshotInput) => {
  const snapshot: StoreMapSnapshot = {
    ...input,
    savedAt: Date.now(),
    version: STORE_MAP_SNAPSHOT_VERSION,
  };

  // 저장소를 쓸 수 없으면(용량 초과·비공개 모드 등) 복원 없이 기본 지도로 돌아온다.
  writeJsonStorage("session", STORE_MAP_SNAPSHOT_STORAGE_KEY, snapshot);
};

/** 보관해 둔 지도 화면. 없거나 오래됐거나 형식이 맞지 않으면 null (읽기만 하고 지우지 않는다). */
export const readStoreMapSnapshot = (): StoreMapSnapshot | null => {
  const stored = readJsonStorage("session", STORE_MAP_SNAPSHOT_STORAGE_KEY);

  if (stored === null) {
    return null;
  }

  const snapshot = stored as Partial<StoreMapSnapshot>;

  if (
    typeof stored !== "object" ||
    snapshot.version !== STORE_MAP_SNAPSHOT_VERSION ||
    typeof snapshot.savedAt !== "number" ||
    Date.now() - snapshot.savedAt > STORE_MAP_SNAPSHOT_MAX_AGE_MS ||
    !Array.isArray(snapshot.stores)
  ) {
    clearStoreMapSnapshot();
    return null;
  }

  return snapshot as StoreMapSnapshot;
};

export const clearStoreMapSnapshot = () => {
  removeStorage("session", STORE_MAP_SNAPSHOT_STORAGE_KEY);
};

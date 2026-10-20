/** 매장 종류. 통신 매장(PHONE) / 제휴 매장(PARTNER). BE StoreType과 같다. */
export type StoreType = "PHONE" | "PARTNER";

/** 매장 지도·채팅·예약이 함께 쓰는 매장 화면 모델 */
export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  benefitBrand?: string;
  benefitCategory?: string;
  benefitDescription?: string;
  benefitId?: number;
  benefitName?: string;
  consultServices?: string[];
  phone: string;
  providedServices?: string[];
  openNow?: boolean;
  storeType?: StoreType;
  lat: number;
  lng: number;
  distanceText?: string;
};

/**
 * 영업 시간 필터. BE 주변 매장 조회의 openNow / openAt 쿼리와 맞춘다.
 * all: 조건 없음, now: 지금 영업 중, at: 그 시각("HH:mm")에 영업 중
 */
export type StoreOpenFilter =
  { mode: "all" } | { mode: "now" } | { mode: "at"; time: string };

/** GET /admin/stores 항목 */
export type AdminStore = {
  storeId: number;
  name: string;
  address: string;
  storeType: AdminStoreType;
  benefitId?: number | null;
  brand?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminStoreType = StoreType;

export type AdminStoreDetail = AdminStore & {
  lat: number;
  lng: number;
  businessHours?: string | null;
  phone?: string;
  consultServices: string[];
  providedServices: string[];
  benefitName?: string | null;
};

export type AdminStoreRequest = Omit<
  AdminStoreDetail,
  "brand" | "category" | "benefitName" | "storeId" | "storeType"
>;

export type AdminStoreFormInput = Omit<
  AdminStoreDetail,
  | "brand"
  | "category"
  | "benefitName"
  | "createdAt"
  | "storeId"
  | "storeType"
  | "updatedAt"
>;

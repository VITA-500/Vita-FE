export const adminFaqCategories = [
  "유심(USIM) 업데이트 · 교체",
  "모바일",
  "인터넷/IPTV",
  "전화",
  "결합 할인",
  "해외로밍",
  "소상공인",
  "가입 및 변경",
  "요금 및 납부",
  "서비스안내",
] as const;

export type AdminFaqCategory = (typeof adminFaqCategories)[number];
export type AdminFaqStatus = "ACTIVE" | "INACTIVE";

export const adminFaqSubcategories = {
  "유심(USIM) 업데이트 · 교체": [
    "시행 배경",
    "업데이트와 교체 대상 · 일정",
    "온라인 간편 업데이트",
    "매장방문",
    "그 외 안내사항",
    "유심 무료 교체 쿠폰",
  ],
  모바일: ["요금제", "단말기(휴대폰)", "모바일서비스"],
  "인터넷/IPTV": [
    "인터넷 상품안내",
    "인터넷 요금안내",
    "인터넷 장비안내",
    "인터넷 부가서비스",
    "인터넷 속도/품질",
    "인터넷 장애/고장",
    "IPTV 상품안내",
    "IPTV 요금안내",
    "IPTV 장비안내",
    "IPTV 부가서비스",
    "IPTV 주요서비스",
    "IPTV 장애/고장",
  ],
  전화: ["인터넷전화", "수신자 부담전화"],
  "결합 할인": ["유무선 결합", "유선 결합", "무선 결합", "신규 가입 불가"],
  해외로밍: ["서비스안내", "WCDMA/GSM"],
  소상공인: ["인터넷", "전화", "CCTV", "IPTV"],
  "가입 및 변경": [
    "모바일",
    "인터넷",
    "TV",
    "인터넷전화",
    "군입대 일시정지",
    "설치장소 변경",
  ],
  "요금 및 납부": ["요금납부", "요금조회"],
  서비스안내: ["통화품질", "정보변경"],
} as const satisfies Record<AdminFaqCategory, readonly string[]>;

export type AdminFaq = {
  faqId: number;
  category: AdminFaqCategory;
  subcategory?: string;
  question: string;
  answer: string;
  status: AdminFaqStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminFaqCreateRequest = {
  category: AdminFaqCategory;
  subcategory?: string;
  question: string;
  answer: string;
};

export type AdminFaqUpdateRequest = AdminFaqCreateRequest & {
  status: AdminFaqStatus;
};

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

export type AdminStoreType = "PHONE" | "PARTNER";

export type AdminStoreDetail = AdminStore & {
  lat: number;
  lng: number;
  businessHours?: string;
  phone?: string;
  consultServices: string[];
  providedServices: string[];
  benefitName?: string | null;
};

export type AdminStoreRequest = Omit<
  AdminStoreDetail,
  "brand" | "category" | "benefitName" | "storeId" | "storeType"
>;

export type AdminBenefit = {
  benefitId: number;
  brand: string;
  name: string;
  category: string;
  description: string;
  storeCount: number;
};

export type PageResponse<T> = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  content: T[];
};

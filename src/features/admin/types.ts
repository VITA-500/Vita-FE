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

export type AdminBenefit = {
  benefitId: number;
  brand: string;
  name: string;
  category: string;
  description: string;
  storeCount: number;
};

/** 제휴 혜택 카테고리. BE Benefit.CATEGORIES와 같다(다른 값은 BE가 400). */
export const adminBenefitCategories = [
  "카페",
  "아이스크림",
  "영화",
  "외식",
  "자동차",
  "쇼핑",
  "여가",
] as const;

export type AdminBenefitCategory = (typeof adminBenefitCategories)[number];

/** GET /admin/benefits 항목 (BE AdminBenefitResponse) */
export type AdminBenefitDetail = Omit<AdminBenefit, "description"> & {
  description: string | null;
  /** 이 혜택에 연결된 제휴 매장 수. 1개 이상이면 삭제할 수 없다(409). */
  storeCount: number;
  createdAt: string;
  updatedAt: string;
};

/** POST /admin/benefits, PATCH /admin/benefits/{id} 요청 (BE BenefitRequest) */
export type AdminBenefitRequest = {
  /** 브랜드명(50자 이내, 중복 불가 409) */
  brand: string;
  /** 혜택 이름(100자 이내) */
  name: string;
  category: AdminBenefitCategory;
  description?: string | null;
};

export type PageResponse<T> = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  content: T[];
};

/** 답변 피드백 유형. BE UnresolvedReason과 같다(DISLIKED는 사용자가 "아쉬워요"를 누른 답변). */
export type AdminAnswerFeedbackReason =
  "NO_MATCH" | "LOW_SIMILARITY" | "ANSWER_FAILED" | "DISLIKED";

/** GET /admin/stats/chat 의 답변 피드백 항목(같은 질문끼리 묶음). BE 응답 필드 이름은 candidates. */
export type AdminAnswerFeedback = {
  /** 가장 최근에 나온 답변 메시지 id */
  id: number;
  question: string;
  /** 가장 최근에 나온 챗봇 답변 */
  answer: string | null;
  source: string;
  /** 가장 최근 발생의 사유 */
  failReason: AdminAnswerFeedbackReason | string;
  /** 같은 질문으로 들어온 피드백 횟수(답변 메시지 수) */
  count: number;
  lastOccurredAt: string;
};

export type AdminAnswerFeedbackStats = {
  summary: {
    /** 답변 피드백 항목 수(같은 질문은 하나로) */
    unresolvedCount: number;
    /** 답변 피드백이 나온 전체 횟수 */
    repeatCount: number;
    /** 오늘 마지막으로 나온 답변 피드백 항목 수 */
    todayCount: number;
  };
  /** 많이 나온 순 */
  candidates: AdminAnswerFeedback[];
};

/** PATCH /admin/stats/chat/{id}/dismiss 응답 */
export type AdminAnswerFeedbackDismissResponse = {
  /** 무시한 항목 id (candidates[].id) */
  id: number;
  /** 무시 처리된 "아쉬워요" 수 */
  dismissedCount: number;
};

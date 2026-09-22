export const adminFaqCategories = [
  "유심(USIM) 업데이트 · 교체",
  "모바일",
  "유심",
  "로밍",
  "인터넷",
  "멤버십",
  "기타",
] as const;

export type AdminFaqCategory = (typeof adminFaqCategories)[number];
export type AdminFaqStatus = "ACTIVE" | "INACTIVE";

export type AdminFaq = {
  faqId: number;
  category: AdminFaqCategory;
  subcategory?: string;
  question: string;
  status: AdminFaqStatus;
  createdAt: string;
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
};

export type AdminStoreDetail = AdminStore & {
  lat: number;
  lng: number;
  businessHours?: string;
  phone?: string;
  consultServices: string[];
  providedServices: string[];
};

export type AdminStoreRequest = Omit<AdminStoreDetail, "storeId">;

export type PageResponse<T> = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  content: T[];
};

// FAQ 타입은 entities/faq로 옮겼다. 기존 import 경로 호환용 재내보내기.
export {
  adminFaqCategories,
  adminFaqSubcategories,
  type AdminFaq,
  type AdminFaqCategory,
  type AdminFaqCreateRequest,
  type AdminFaqStatus,
  type AdminFaqUpdateRequest,
} from "@/entities/faq";

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

// 제휴 혜택 타입은 entities/benefit으로 옮겼다. 기존 import 경로 호환용 재내보내기.
export {
  adminBenefitCategories,
  type AdminBenefitCategory,
  type AdminBenefitDetail,
  type AdminBenefitRequest,
  type BenefitSummary as AdminBenefit,
} from "@/entities/benefit";
export type { PageResponse } from "@/shared/api/response";

// 답변 피드백 타입은 entities/feedback으로 옮겼다. 기존 import 경로 호환용 재내보내기.
export type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackDismissResponse,
  AdminAnswerFeedbackReason,
  AdminAnswerFeedbackStats,
} from "@/entities/feedback";

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

// 매장 타입은 entities/store로 옮겼다. 기존 import 경로 호환용 재내보내기.
export type {
  AdminStore,
  AdminStoreDetail,
  AdminStoreFormInput,
  AdminStoreRequest,
  AdminStoreType,
} from "@/entities/store";

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

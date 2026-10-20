// FAQ entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
export { adminFaqApi } from "@/entities/faq/api/admin";
export {
  adminFaqCategories,
  adminFaqSubcategories,
  type AdminFaq,
  type AdminFaqCategory,
  type AdminFaqCreateRequest,
  type AdminFaqStatus,
  type AdminFaqUpdateRequest,
} from "@/entities/faq/model/types";

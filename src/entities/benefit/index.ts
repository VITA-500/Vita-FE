// 제휴 혜택 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
export { benefitApi } from "@/entities/benefit/api/benefitApi";
export {
  ADMIN_BENEFIT_MAX_PAGE_SIZE,
  adminBenefitApi,
} from "@/entities/benefit/api/admin";
export { toBenefitCategoryOptions } from "@/entities/benefit/model/categoryOptions";
export {
  adminBenefitCategories,
  type AdminBenefitCategory,
  type AdminBenefitDetail,
  type AdminBenefitRequest,
  type BenefitCategoryOption,
  type BenefitSummary,
} from "@/entities/benefit/model/types";
export {
  getBenefitCategoryIcon,
  renderBenefitCategoryIcon,
} from "@/entities/benefit/ui/benefitCategoryIcon";

import type { AdminPlan } from "@/entities/plan";
import type { AdminBenefitDetail } from "@/entities/benefit";
import type { AdminUserListItem } from "@/entities/user";
import type { AdminStoreDetail } from "@/entities/store";
import { storeDetails } from "@/features/admin/common/lib/adminData";

const createdAt = "2026-10-01T09:00:00";
export const previewPlans: AdminPlan[] = ["일반", "청년", "시니어", "키즈"].map(
  (label, index) => ({
    planId: index + 1,
    planCode: `PREVIEW-${index + 1}`,
    name: `비타 ${label} 요금제`,
    summary: "화면 개발용 샘플 요금제",
    price: 29000 + index * 10000,
    networkType: "5G",
    targetGroup: (["GENERAL", "YOUTH", "SENIOR", "KIDS"] as const)[index],
    minAge: null,
    maxAge: null,
    dataPolicy: "LIMITED",
    baseDataMb: 15360,
    exhaustedSpeedKbps: 1000,
    voicePolicy: "UNLIMITED",
    voiceMinutes: null,
    smsPolicy: "UNLIMITED",
    smsCount: null,
    description: "목데이터입니다.",
    status: index === 2 ? "INACTIVE" : "ACTIVE",
    createdAt,
    updatedAt: createdAt,
  }),
);
export const previewBenefits: AdminBenefitDetail[] = [
  "카페",
  "영화",
  "외식",
].map((category, index) => ({
  benefitId: index + 1,
  brand: ["비타커피", "비타시네마", "비타키친"][index],
  name: "멤버십 10% 할인",
  category,
  description: "멤버십 이용 시 할인 제공",
  storeCount: 1,
  createdAt,
  updatedAt: createdAt,
}));
export const previewUsers: AdminUserListItem[] = Array.from(
  { length: 24 },
  (_, index) => ({
    userId: index + 1,
    name: `샘플회원 ${index + 1}`,
    email: `sample${index + 1}@example.com`,
    role: index === 0 ? "ADMIN" : "USER",
    status: index % 5 === 0 ? "SUSPENDED" : "ACTIVE",
    createdAt,
  }),
);
export const previewPartnerStores: AdminStoreDetail[] = previewBenefits.map(
  (benefit, index) => ({
    storeId: 101 + index,
    name: `${benefit.brand} 강남점`,
    storeType: "PARTNER",
    address: "서울 강남구 테헤란로 152",
    lat: 37.5 + index * 0.01,
    lng: 127.03,
    businessHours: "09:00-21:00",
    phone: "02-1234-5678",
    consultServices: [],
    providedServices: [],
    benefitId: benefit.benefitId,
    createdAt,
    updatedAt: createdAt,
  }),
);
export const previewStoreDetails = [...storeDetails, ...previewPartnerStores];

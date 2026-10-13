import type {
  AdminChatStats,
  AdminFaq,
  AdminStore,
  AdminStoreDetail,
} from "@/features/admin/types";
import { adminFaqCategories } from "@/features/admin/types";

export const popularFaqTags = adminFaqCategories;

export const faqRows: AdminFaq[] = Array.from({ length: 9 }, (_, index) => ({
  faqId: index + 1,
  question:
    index % 3 === 0
      ? "가족 결합 할인은 멤버십 혜택과 중복되나요?"
      : index % 3 === 1
        ? "유심 재발급은 어떤 서류가 필요한가요?"
        : "해외 로밍 요금제는 언제부터 적용되나요?",
  answer:
    index % 3 === 0
      ? "가족 결합 할인과 멤버십 혜택은 상품 조건에 따라 중복 적용 여부가 달라질 수 있습니다."
      : index % 3 === 1
        ? "유심 재발급 시 본인 확인을 위한 신분증과 가입자 정보 확인이 필요합니다."
        : "해외 로밍 요금제는 신청한 시작일 기준으로 적용되며 국가별 제공량과 요금이 다를 수 있습니다.",
  category: adminFaqCategories[index % adminFaqCategories.length],
  subcategory: index % 2 === 0 ? "기본" : "상세",
  status: index === 7 ? "INACTIVE" : "ACTIVE",
  createdAt: `2026-09-${String(10 + index).padStart(2, "0")}T10:00:00`,
  updatedAt: `2026-09-${String(18 + index).padStart(2, "0")}T15:30:00`,
}));

export const storeRows: AdminStore[] = Array.from(
  { length: 8 },
  (_, index) => ({
    storeId: index + 1,
    name: [
      "VITA 수원역점",
      "VITA 강남점",
      "VITA 홍대입구점",
      "VITA 판교점",
      "VITA 잠실점",
      "VITA 부산서면점",
      "VITA 대구동성로점",
      "VITA 광주충장로점",
    ][index],
    address: [
      "경기 수원시 팔달구",
      "서울 강남구 테헤란로",
      "서울 마포구 양화로",
      "경기 성남시 분당구",
      "서울 송파구 올림픽로",
      "부산 부산진구 중앙대로",
      "대구 중구 동성로",
      "광주 동구 충장로",
    ][index],
    storeType: "PHONE",
    createdAt: `2026-09-${String(10 + index).padStart(2, "0")}T10:00:00`,
    updatedAt: `2026-09-${String(18 + index).padStart(2, "0")}T15:30:00`,
  }),
);

export const storeDetails: AdminStoreDetail[] = storeRows.map(
  (store, index) => ({
    ...store,
    lat: 37.266 + index * 0.01,
    lng: 127.0 + index * 0.01,
    businessHours: "09:00-21:00",
    phone: "031-123-4567",
    consultServices:
      index % 2 === 0
        ? ["휴대폰상담", "요금제변경", "인터넷상담"]
        : ["휴대폰상담", "요금수납"],
    providedServices: index % 2 === 0 ? ["유심발급", "기기변경"] : ["유심발급"],
  }),
);

/** API 주소가 없는 환경(Storybook·로컬 목업)용 미해결 질문 통계. */
export const mockChatStats: AdminChatStats = {
  summary: { unresolvedCount: 3, repeatCount: 36, todayCount: 1 },
  candidates: [
    {
      id: 1,
      question:
        "해외에서 데이터가 갑자기 안 터질 때 바로 확인할 설정이 있나요?",
      answer: "해당 정보는 확인이 어렵습니다. 고객센터로 문의해주세요.",
      source: "CHAT",
      failReason: "LOW_SIMILARITY",
      count: 18,
      lastOccurredAt: "2026-10-06T08:45:00",
    },
    {
      id: 2,
      question:
        "가족 결합 중 한 명만 알뜰폰으로 이동하면 할인은 어떻게 되나요?",
      answer: "해당 정보는 확인이 어렵습니다. 고객센터로 문의해주세요.",
      source: "CHAT",
      failReason: "NO_MATCH",
      count: 11,
      lastOccurredAt: "2026-10-05T21:10:00",
    },
    {
      id: 3,
      question: "분실 신고 후 유심 재발급까지 대리점 방문 없이 가능한가요?",
      answer: "분실 신고 후 유심 재발급은 가까운 매장 방문이 필요해요.",
      source: "CHAT",
      failReason: "DISLIKED",
      count: 7,
      lastOccurredAt: "2026-10-05T18:32:00",
    },
  ],
};

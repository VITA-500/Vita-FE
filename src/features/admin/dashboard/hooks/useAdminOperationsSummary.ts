"use client";

import { useQuery } from "@tanstack/react-query";
import { mockOperationsSummary } from "@/features/admin/common/lib/adminData";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import {
  ADMIN_BENEFIT_MAX_PAGE_SIZE,
  adminBenefitApi,
} from "@/entities/benefit";
import { adminFaqApi } from "@/entities/faq";
import { adminUserApi } from "@/entities/user";
import { env } from "@/shared/config/env";

export type AdminOperationsSummary = typeof mockOperationsSummary;

/** 연결 매장이 0개인 혜택을 세려면 혜택 전체가 필요하다. 최대 페이지 크기로 끝까지 받는다. */
const fetchBenefitCounts = async () => {
  const first = await adminBenefitApi.fetchBenefits({
    page: 0,
    size: ADMIN_BENEFIT_MAX_PAGE_SIZE,
  });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      adminBenefitApi.fetchBenefits({
        page: index + 1,
        size: ADMIN_BENEFIT_MAX_PAGE_SIZE,
      }),
    ),
  );
  const benefits = [first, ...rest].flatMap((page) => page.content);

  return {
    benefits: first.totalCount,
    emptyBenefits: benefits.filter((benefit) => benefit.storeCount === 0)
      .length,
  };
};

/**
 * 대시보드 운영 현황. 기존 관리자 목록 API의 totalCount로 개수만 받는다.
 * API 주소가 없는 환경에서는 목데이터를 쓴다.
 */
export const useAdminOperationsSummary = () => {
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.operationsSummary,
    queryFn: async (): Promise<AdminOperationsSummary> => {
      const [phoneStores, partnerStores, benefitCounts, faqs, suspended] =
        await Promise.all([
          adminStoreService.countStores("PHONE"),
          adminStoreService.countStores("PARTNER"),
          fetchBenefitCounts(),
          adminFaqApi.fetchFaqs({ page: 0, size: 1, status: "ACTIVE" }),
          adminUserApi.fetchUsers({ page: 0, size: 1, status: "SUSPENDED" }),
        ]);

      return {
        phoneStores,
        partnerStores,
        ...benefitCounts,
        activeFaqs: faqs.totalCount,
        suspendedUsers: suspended.totalCount,
      };
    },
  });

  if (!env.apiBaseUrl) {
    return { error: null, isLoading: false, summary: mockOperationsSummary };
  }

  return {
    error: query.error ? "운영 현황을 불러오지 못했어요." : null,
    isLoading: query.isPending,
    summary: query.data ?? null,
  };
};

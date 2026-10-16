"use client";

import { useQuery } from "@tanstack/react-query";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import { env } from "@/shared/config/env";

export const useAdminStoreQuality = () => {
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryKey: adminQueryKeys.storeQuality,
    queryFn: async () => {
      const first = await adminStoreService.fetchStores({
        page: 0,
        size: 100,
        sortBy: "storeId,asc",
      });
      const pages = await Promise.all(
        Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
          adminStoreService.fetchStores({
            page: index + 1,
            size: 100,
            sortBy: "storeId,asc",
          }),
        ),
      );
      return [first, ...pages].flatMap((page) => page.details);
    },
  });
  const details = query.data ?? [];
  const missingPhone = details.filter((store) => !store.phone?.trim()).length;
  const missingBusinessHours = details.filter(
    (store) => !store.businessHours?.trim(),
  ).length;
  const missingServices = details.filter(
    (store) =>
      store.consultServices.length === 0 && store.providedServices.length === 0,
  ).length;
  return {
    isLoading: query.isPending,
    error: query.error ? "매장 데이터 품질을 확인하지 못했어요." : null,
    missingPhone,
    missingBusinessHours,
    missingServices,
    issueCount: missingPhone + missingBusinessHours + missingServices,
  };
};

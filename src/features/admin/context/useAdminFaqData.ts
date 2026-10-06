"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { faqRows } from "@/features/admin/constants/adminData";
import type {
  AdminFaqData,
  FaqCategoryFilter,
  FaqSortDirection,
  FaqSortField,
  FaqStatusFilter,
} from "@/features/admin/context/adminDataTypes";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminFaqService } from "@/features/admin/lib/adminFaqService";
import type { AdminFaq } from "@/features/admin/types";
import { env } from "@/shared/config/env";

export const useAdminFaqData = (): AdminFaqData => {
  const queryClient = useQueryClient();
  const [faqs, setFaqs] = useState<AdminFaq[]>(env.apiBaseUrl ? [] : faqRows);
  const [faqError] = useState<string | null>(null);
  const [faqKeyword, setFaqKeywordState] = useState("");
  const [faqPage, setFaqPage] = useState(0);
  const [faqPageSize, setFaqPageSizeState] = useState(20);
  const [faqCategoryFilter, setFaqCategoryFilterState] =
    useState<FaqCategoryFilter>("ALL");
  const [faqStatusFilter, setFaqStatusFilterState] =
    useState<FaqStatusFilter>("ACTIVE");
  const [faqSortField, setFaqSortField] = useState<FaqSortField>("createdAt");
  const [faqSortDirection, setFaqSortDirection] =
    useState<FaqSortDirection>("desc");
  const [faqTotalCount] = useState(env.apiBaseUrl ? 0 : faqRows.length);
  const [faqTotalPages] = useState(1);

  const faqQuery = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryFn: () =>
      adminFaqService.fetchFaqs({
        category: faqCategoryFilter === "ALL" ? undefined : faqCategoryFilter,
        keyword: faqKeyword,
        page: faqPage,
        size: faqPageSize,
        sortBy: `${faqSortField},${faqSortDirection}`,
        status: faqStatusFilter === "ALL" ? undefined : faqStatusFilter,
      }),
    queryKey: adminQueryKeys.faqs({
      category: faqCategoryFilter,
      keyword: faqKeyword,
      page: faqPage,
      pageSize: faqPageSize,
      sortDirection: faqSortDirection,
      sortField: faqSortField,
      status: faqStatusFilter,
    }),
  });

  const refreshFaqs = useCallback(async () => {
    if (!env.apiBaseUrl) return;

    await faqQuery.refetch();
  }, [faqQuery]);

  const currentFaqs = useMemo(
    () => (env.apiBaseUrl ? (faqQuery.data?.content ?? []) : faqs),
    [faqQuery.data?.content, faqs],
  );
  const currentFaqError =
    env.apiBaseUrl && faqQuery.error
      ? faqQuery.error instanceof Error
        ? faqQuery.error.message
        : "FAQ 데이터를 불러오지 못했습니다."
      : faqError;
  const currentFaqTotalCount = env.apiBaseUrl
    ? (faqQuery.data?.totalCount ?? 0)
    : faqTotalCount;
  const currentFaqTotalPages = env.apiBaseUrl
    ? Math.max(1, faqQuery.data?.totalPages ?? 1)
    : faqTotalPages;

  const setFaqKeyword = useCallback((keyword: string) => {
    setFaqKeywordState(keyword);
    setFaqPage(0);
  }, []);

  const setFaqPageSize = useCallback((pageSize: number) => {
    setFaqPageSizeState(pageSize);
    setFaqPage(0);
  }, []);

  const setFaqCategoryFilter = useCallback((category: FaqCategoryFilter) => {
    setFaqCategoryFilterState(category);
    setFaqPage(0);
  }, []);

  const setFaqStatusFilter = useCallback((status: FaqStatusFilter) => {
    setFaqStatusFilterState(status);
    setFaqPage(0);
  }, []);

  const setFaqSort = useCallback(
    (field: FaqSortField, direction: FaqSortDirection) => {
      setFaqSortField(field);
      setFaqSortDirection(direction);
      setFaqPage(0);
    },
    [],
  );

  return useMemo<AdminFaqData>(
    () => ({
      faqs: currentFaqs,
      addFaq: async (input) => {
        if (env.apiBaseUrl) {
          await adminFaqService.createFaq(input);
          await queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
          return;
        }

        const nextFaqId = Math.max(0, ...faqs.map((faq) => faq.faqId)) + 1;
        setFaqs([
          {
            ...input,
            faqId: nextFaqId,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...faqs,
        ]);
      },
      deleteFaq: async (faqId) => {
        if (env.apiBaseUrl) {
          await adminFaqService.deleteFaq(faqId);
          await queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status: "INACTIVE" } : faq,
          ),
        );
      },
      faqCategoryFilter,
      faqError: currentFaqError,
      faqKeyword,
      faqPage,
      faqPageSize,
      faqSortDirection,
      faqSortField,
      faqStatusFilter,
      faqTotalCount: currentFaqTotalCount,
      faqTotalPages: currentFaqTotalPages,
      isFaqLoading: env.apiBaseUrl
        ? faqQuery.isLoading || faqQuery.isFetching
        : false,
      refreshFaqs,
      saveFaq: async (faqId, input) => {
        if (env.apiBaseUrl) {
          await adminFaqService.updateFaq(faqId, input);
          await queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, ...input } : faq,
          ),
        );
      },
      setFaqCategoryFilter,
      setFaqKeyword,
      setFaqPage,
      setFaqPageSize,
      setFaqSort,
      setFaqStatus: async (faqId, status) => {
        if (env.apiBaseUrl) {
          await adminFaqService.updateFaq(faqId, { status });
          await queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
          return;
        }

        setFaqs((currentFaqs) =>
          currentFaqs.map((faq) =>
            faq.faqId === faqId ? { ...faq, status } : faq,
          ),
        );
      },
      setFaqStatusFilter,
    }),
    [
      currentFaqError,
      currentFaqs,
      currentFaqTotalCount,
      currentFaqTotalPages,
      faqCategoryFilter,
      faqKeyword,
      faqPage,
      faqPageSize,
      faqQuery.isFetching,
      faqQuery.isLoading,
      faqSortDirection,
      faqSortField,
      faqStatusFilter,
      faqs,
      queryClient,
      refreshFaqs,
      setFaqCategoryFilter,
      setFaqKeyword,
      setFaqPageSize,
      setFaqSort,
      setFaqStatusFilter,
    ],
  );
};

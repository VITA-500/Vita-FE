"use client";

import { Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { FaqFormModal } from "@/features/admin/components/FaqFormModal";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminResultSummary } from "@/features/admin/components/AdminResultSummary";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { FaqStatusModal } from "@/features/admin/components/FaqStatusModal";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import {
  adminFaqCategories,
  type AdminFaqCategory,
} from "@/features/admin/types";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { SearchInput } from "@/shared/ui/SearchInput";
import type { SelectOption } from "@/shared/ui/Select";

const faqCategoryOptions: readonly SelectOption[] = adminFaqCategories.map(
  (category) => ({ label: category, value: category }),
);
type FaqCategoryFilter = "ALL" | AdminFaqCategory;
type FaqStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const faqCategoryFilterOptions: readonly SelectOption[] = [
  { label: "전체", value: "ALL" },
  ...faqCategoryOptions,
];

const faqStatusFilterOptions = [
  { label: "전체", value: "ALL" },
  { label: "활성", value: "ACTIVE" },
  { label: "비활성", value: "INACTIVE" },
] as const;
const faqSortOptions = [
  { label: "최신 등록순", value: "createdAt:desc" },
  { label: "최근 수정순", value: "updatedAt:desc" },
] as const;
const pageSizeOptions = [20, 50, 100] as const;
const pageSizeFilterOptions = pageSizeOptions.map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));
const MIN_TABLE_ROWS = 8;

export const FaqManagement = () => {
  const {
    addFaq,
    deleteFaq,
    faqCategoryFilter,
    faqError,
    faqKeyword,
    faqPage,
    faqPageSize,
    faqSortDirection,
    faqSortField,
    faqStatusFilter,
    faqTotalCount,
    faqTotalPages,
    faqs,
    isFaqLoading,
    saveFaq,
    setFaqCategoryFilter,
    setFaqKeyword,
    setFaqPage,
    setFaqPageSize,
    setFaqSort,
    setFaqStatus,
    setFaqStatusFilter,
  } = useAdminData();
  const { runWithStatus } = useActionStatus();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [activatingFaqId, setActivatingFaqId] = useState<number | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [searchDraft, setSearchDraft] = useState(faqKeyword);
  const hasSearchKeyword = faqKeyword.trim().length > 0;
  const shouldShowSkeletonRows = isFaqLoading;
  const visibleSkeletonRows = shouldShowSkeletonRows
    ? Math.min(faqPageSize, MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, MIN_TABLE_ROWS - faqs.length)
    : 0;

  const editingFaq = faqs.find((faq) => faq.faqId === editingFaqId);
  const activatingFaq = faqs.find((faq) => faq.faqId === activatingFaqId);
  const deletingFaq = faqs.find((faq) => faq.faqId === deletingFaqId);
  const rangeStart = faqTotalCount === 0 ? 0 : faqPage * faqPageSize + 1;
  const rangeEnd =
    faqTotalCount === 0
      ? 0
      : Math.min(faqTotalCount, rangeStart + faqs.length - 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft !== faqKeyword) {
        setFaqKeyword(searchDraft);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [faqKeyword, searchDraft, setFaqKeyword]);

  const clearSearch = () => {
    setSearchDraft("");
    setFaqKeyword("");
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
            FAQ 관리
          </h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            FAQ를 검색하고, 카테고리별로 관리할 수 있습니다.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          FAQ 등록
        </Button>
      </div>

      <div className="mb-7 grid gap-3 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="질문이나 키워드를 검색하세요"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          {hasSearchKeyword && (
            <Button
              variant="secondary"
              size="sm"
              className="h-12 shrink-0 rounded-2xl"
              onClick={clearSearch}
            >
              초기화
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FilterDropdown
            aria-label="FAQ 정렬"
            className="w-full sm:w-[160px]"
            options={faqSortOptions}
            value={`${faqSortField}:${faqSortDirection}`}
            onChange={(nextValue) => {
              const [field, direction] = nextValue.split(":");
              setFaqSort(
                field as "createdAt" | "updatedAt",
                direction as "asc" | "desc",
              );
            }}
          />
          <FilterDropdown
            aria-label="카테고리 필터"
            className="w-full sm:w-[160px]"
            options={faqCategoryFilterOptions}
            value={faqCategoryFilter}
            onChange={(nextValue) => {
              setFaqCategoryFilter(nextValue as FaqCategoryFilter);
            }}
          />
          <FilterDropdown
            aria-label="FAQ 상태 필터"
            className="w-full sm:w-[120px]"
            options={faqStatusFilterOptions}
            value={faqStatusFilter}
            onChange={(nextValue) =>
              setFaqStatusFilter(nextValue as FaqStatusFilter)
            }
          />
          <FilterDropdown
            aria-label="페이지당 FAQ 수"
            className="w-full sm:w-[120px]"
            options={pageSizeFilterOptions}
            value={String(faqPageSize)}
            onChange={(nextValue) => setFaqPageSize(Number(nextValue))}
          />
        </div>
      </div>

      {faqError && <AdminErrorBanner message={faqError} />}

      <div className="space-y-3 md:hidden">
        {shouldShowSkeletonRows ? (
          Array.from(
            { length: Math.min(visibleSkeletonRows, 4) },
            (_, index) => (
              <FaqSkeletonCard key={`faq-card-skeleton-${index}`} />
            ),
          )
        ) : faqs.length === 0 ? (
          <Card>
            <AdminEmptyState
              title="조건에 맞는 FAQ가 없습니다."
              description="검색어와 카테고리 필터를 조정하거나 새 FAQ를 등록해 주세요."
            />
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.faqId} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-extrabold text-gray-900 dark:text-white">
                    {faq.question}
                  </p>
                  <div className="text-text-secondary mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
                    <span>#{faq.faqId}</span>
                    <span>{faq.category}</span>
                    <span>{faq.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-9 w-9 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  aria-label="FAQ 수정"
                  onClick={() => setEditingFaqId(faq.faqId)}
                >
                  <Edit2 size={20} />
                </Button>
                {faq.status === "ACTIVE" ? (
                  <Button
                    variant="dangerGhost"
                    size="xs"
                    className="h-9 w-9 rounded-lg p-0"
                    aria-label="FAQ 삭제"
                    onClick={() => setDeletingFaqId(faq.faqId)}
                  >
                    <Trash2 size={20} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-9 w-9 rounded-lg p-0 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300"
                    aria-label="FAQ 활성화"
                    onClick={() => setActivatingFaqId(faq.faqId)}
                  >
                    <Eye size={20} />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
        {!shouldShowSkeletonRows && faqs.length > 0 && (
          <AdminPagination
            currentPage={faqPage + 1}
            disabled={isFaqLoading}
            totalPages={faqTotalPages}
            onPageChange={(page) => setFaqPage(page - 1)}
          />
        )}
      </div>

      <Card padding="none" className="hidden overflow-hidden md:block">
        <div>
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
              <tr>
                <th className="w-[88px] px-5 py-4 text-left">ID</th>
                <th className="px-4 py-4 text-left">질문</th>
                <th className="w-[22%] px-4 py-4 text-left">카테고리</th>
                <th className="w-[128px] px-4 py-4 text-center">등록일</th>
                <th className="w-[180px] px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y dark:divide-white/10">
              {shouldShowSkeletonRows ? (
                Array.from({ length: visibleSkeletonRows }, (_, index) => (
                  <FaqSkeletonRow key={`faq-skeleton-${index}`} />
                ))
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-[640px] px-5 py-0">
                    <AdminEmptyState
                      title="조건에 맞는 FAQ가 없습니다."
                      description="검색어와 카테고리 필터를 조정하거나 새 FAQ를 등록해 주세요."
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {faqs.map((faq) => (
                    <tr
                      key={faq.faqId}
                      className="hover:bg-surface-muted/70 min-h-20 transition dark:hover:bg-white/5"
                    >
                      <td className="px-5 py-4 font-bold text-gray-400">
                        #{faq.faqId}
                      </td>
                      <td className="px-4 py-4 font-extrabold break-keep whitespace-normal text-gray-800 dark:text-gray-100">
                        {faq.question}
                      </td>
                      <td className="truncate px-4 py-4 font-semibold text-gray-500">
                        {faq.category}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatKoreanDate(faq.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            aria-label="FAQ 수정"
                            onClick={() => setEditingFaqId(faq.faqId)}
                          >
                            <Edit2 size={30} />
                          </Button>
                          {faq.status === "ACTIVE" ? (
                            <Button
                              variant="dangerGhost"
                              size="sm"
                              className="h-12 w-12 rounded-lg p-0"
                              aria-label="FAQ 삭제"
                              onClick={() => setDeletingFaqId(faq.faqId)}
                            >
                              <Trash2 size={30} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-12 w-12 rounded-lg p-0 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300"
                              aria-label="FAQ 활성화"
                              onClick={() => setActivatingFaqId(faq.faqId)}
                            >
                              <Eye size={30} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {Array.from({
                    length: fillerRowCount,
                  }).map((_, index) => (
                    <tr
                      key={`filler-${index}`}
                      aria-hidden="true"
                      className="h-20"
                    >
                      <td colSpan={5} />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {!shouldShowSkeletonRows && faqs.length > 0 && (
          <div className="border-border-soft flex items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
            <AdminPagination
              currentPage={faqPage + 1}
              disabled={isFaqLoading}
              totalPages={faqTotalPages}
              onPageChange={(page) => setFaqPage(page - 1)}
            />
          </div>
        )}
      </Card>

      <AdminResultSummary
        keyword={hasSearchKeyword ? faqKeyword : ""}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={faqTotalCount}
      />

      <FaqFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(input) => {
          void runWithStatus("FAQ 등록", () => addFaq(input));
          setIsCreateModalOpen(false);
        }}
      />

      <FaqFormModal
        isOpen={editingFaq !== undefined}
        mode="edit"
        initialValues={editingFaq}
        onClose={() => setEditingFaqId(null)}
        onSave={(input) => {
          if (!editingFaq) return;
          const faqId = editingFaq.faqId;
          void runWithStatus("FAQ 수정", () => saveFaq(faqId, input));
          setEditingFaqId(null);
        }}
      />

      <FaqStatusModal
        mode="activate"
        faq={activatingFaq}
        onClose={() => setActivatingFaqId(null)}
        onConfirm={() => {
          if (activatingFaq) {
            const faqId = activatingFaq.faqId;
            void runWithStatus("FAQ 활성화", () =>
              setFaqStatus(faqId, "ACTIVE"),
            );
          }
          setActivatingFaqId(null);
        }}
      />

      <FaqStatusModal
        mode="delete"
        faq={deletingFaq}
        onClose={() => setDeletingFaqId(null)}
        onConfirm={() => {
          if (deletingFaq) {
            const faqId = deletingFaq.faqId;
            void runWithStatus("FAQ 삭제", () => deleteFaq(faqId));
          }
          setDeletingFaqId(null);
        }}
      />
    </div>
  );
};

const FaqSkeletonRow = () => (
  <tr className="h-20" aria-hidden="true">
    <td className="px-5 py-4">
      <div className="bg-surface-muted h-4 w-12 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-[min(360px,80%)] animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-24 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted mx-auto h-4 w-20 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-5 py-4">
      <div className="mx-auto flex justify-center gap-2">
        <div className="bg-surface-muted h-12 w-12 animate-pulse rounded-lg dark:bg-white/10" />
        <div className="bg-surface-muted h-12 w-12 animate-pulse rounded-lg dark:bg-white/10" />
      </div>
    </td>
  </tr>
);

const FaqSkeletonCard = () => (
  <Card padding="sm" aria-hidden="true">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="bg-surface-muted h-4 w-full animate-pulse rounded-full dark:bg-white/10" />
        <div className="bg-surface-muted h-3 w-2/3 animate-pulse rounded-full dark:bg-white/10" />
      </div>
    </div>
    <div className="mt-4 flex justify-end gap-1.5">
      <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
      <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
    </div>
  </Card>
);

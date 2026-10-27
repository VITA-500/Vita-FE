"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import { AdminErrorBanner } from "@/features/admin/common/components/AdminErrorBanner";
import { FaqFormModal } from "@/features/admin/faq/components/FaqFormModal";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { AdminTableShell } from "@/features/admin/common/components/AdminTableShell";
import { AdminResultSummary } from "@/features/admin/common/components/AdminResultSummary";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";
import { FaqStatusModal } from "@/features/admin/faq/components/FaqStatusModal";
import { FaqRowActions } from "@/features/admin/faq/components/FaqRowActions";
import {
  FaqSkeletonCard,
  FaqSkeletonRow,
} from "@/features/admin/faq/components/FaqManagementParts";
import { useActionStatus } from "@/features/admin/common/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/common/context/AdminDataContext";
import {
  FAQ_MIN_TABLE_ROWS,
  faqCategoryFilterOptions,
  faqPageSizeFilterOptions,
  faqSortOptions,
  faqStatusFilterOptions,
} from "@/features/admin/faq/lib/faqManagementConfig";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Card } from "@/shared/ui/atoms/Card";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { AdminStatusBadge } from "@/features/admin/common/components/AdminStatusBadge";
import { AdminPageHeader } from "@/features/admin/common/components/AdminPageHeader";
import { AdminListToolbar } from "@/features/admin/common/components/AdminListToolbar";
import type { AdminFaqCategory } from "@/entities/faq";
type FaqCategoryFilter = "ALL" | AdminFaqCategory;
type FaqStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

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
    ? Math.min(faqPageSize, FAQ_MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, FAQ_MIN_TABLE_ROWS - faqs.length)
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
      <AdminPageHeader
        title="FAQ 관리"
        description="FAQ를 검색하고, 카테고리별로 관리할 수 있습니다."
        action={
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            FAQ 등록
          </Button>
        }
      />

      <AdminListToolbar className="mb-6 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
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
              className="h-10 shrink-0 rounded-xl"
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
            options={faqPageSizeFilterOptions}
            value={String(faqPageSize)}
            onChange={(nextValue) => setFaqPageSize(Number(nextValue))}
          />
        </div>
      </AdminListToolbar>

      {faqError && <AdminErrorBanner message={faqError} />}

      <div className="space-y-3 lg:hidden">
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
                <FaqRowActions
                  compact
                  isActive={faq.status === "ACTIVE"}
                  onEdit={() => setEditingFaqId(faq.faqId)}
                  onDeactivate={() => setDeletingFaqId(faq.faqId)}
                  onActivate={() => setActivatingFaqId(faq.faqId)}
                />
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

      <AdminTableShell
        className="hidden lg:block"
        pagination={
          !shouldShowSkeletonRows && faqs.length > 0 ? (
            <AdminPagination
              currentPage={faqPage + 1}
              disabled={isFaqLoading}
              totalPages={faqTotalPages}
              onPageChange={(page) => setFaqPage(page - 1)}
            />
          ) : null
        }
      >
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-surface-muted text-[11px] font-semibold text-gray-400 dark:bg-white/5">
            <tr>
              <th className="w-[96px] px-5 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">질문 / 답변 요약</th>
              <th className="w-[20%] px-4 py-3 text-left">카테고리</th>
              <th className="w-[150px] px-4 py-3 text-center">상태</th>
              <th className="w-[128px] px-4 py-3 text-center">수정일</th>
              <th className="w-[132px] px-5 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-border-soft divide-y dark:divide-white/10">
            {shouldShowSkeletonRows ? (
              Array.from({ length: visibleSkeletonRows }, (_, index) => (
                <FaqSkeletonRow key={`faq-skeleton-${index}`} />
              ))
            ) : faqs.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-[640px] px-5 py-0">
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
                    className="hover:bg-surface-muted/70 min-h-16 transition dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-3 text-xs font-bold whitespace-nowrap text-gray-400">
                      #{faq.faqId}
                    </td>
                    <td className="px-4 py-3 break-keep whitespace-normal">
                      <p className="line-clamp-1 text-sm font-bold text-gray-800 dark:text-gray-100">
                        {faq.question}
                      </p>
                      <p className="text-text-secondary mt-1 line-clamp-1 text-xs font-normal">
                        {faq.answer}
                      </p>
                    </td>
                    <td className="truncate px-4 py-3 text-xs font-medium text-gray-500">
                      {faq.category}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminStatusBadge
                        label={
                          faq.status === "ACTIVE"
                            ? "활성 · 답변에 사용"
                            : "비활성 · 보관"
                        }
                        tone={faq.status === "ACTIVE" ? "active" : "inactive"}
                        icon={faq.status === "ACTIVE" ? "active" : "inactive"}
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-400">
                      {formatKoreanDate(faq.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <FaqRowActions
                        isActive={faq.status === "ACTIVE"}
                        onEdit={() => setEditingFaqId(faq.faqId)}
                        onDeactivate={() => setDeletingFaqId(faq.faqId)}
                        onActivate={() => setActivatingFaqId(faq.faqId)}
                      />
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
                    <td colSpan={6} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </AdminTableShell>

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
            setFaqStatusFilter("ALL");
            void runWithStatus("FAQ 활성화", () =>
              setFaqStatus(faqId, "ACTIVE"),
            );
          }
          setActivatingFaqId(null);
        }}
      />

      <FaqStatusModal
        mode="deactivate"
        faq={deletingFaq}
        onClose={() => setDeletingFaqId(null)}
        onConfirm={() => {
          if (deletingFaq) {
            const faqId = deletingFaq.faqId;
            setFaqStatusFilter("ALL");
            void runWithStatus("FAQ 비활성화", () => deleteFaq(faqId));
          }
          setDeletingFaqId(null);
        }}
      />
    </div>
  );
};

"use client";

import {
  BenefitManagementHeader,
  BenefitDeleteModal,
  BenefitActions,
  BenefitSummary,
  BenefitCategoryBadge,
  BenefitEmptyState,
} from "./BenefitManagementParts";

import { useEffect, useState } from "react";
import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminResultSummary } from "@/features/admin/components/AdminResultSummary";
import { BenefitFormModal } from "@/features/admin/components/BenefitFormModal";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import {
  BENEFIT_MIN_TABLE_ROWS,
  benefitCategoryFilterOptions,
  benefitPageSizeOptions,
  benefitSortOptions,
} from "@/features/admin/lib/benefitManagementConfig";
import {
  useAdminBenefits,
  type BenefitCategoryFilter,
  type BenefitSort,
} from "@/features/admin/context/useAdminBenefits";
import { type AdminBenefitRequest } from "@/features/admin/types";
import { ApiError } from "@/shared/api/http";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { SearchInput } from "@/shared/ui/SearchInput";
import { showToast } from "@/shared/ui/ToastProvider";

/** BE 오류 문구(브랜드 중복·연결 매장 있음 등)를 그대로 보여주고, 없으면 기본 문구 */
const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.message ? error.message : fallback;

/** 관리자 제휴 혜택(브랜드) 관리: 검색·카테고리 필터, 등록·수정·삭제 */
export const BenefitManagement = ({
  embedded = false,
  onSelectCategory,
}: {
  embedded?: boolean;
  onSelectCategory?: (category: string) => void;
}) => {
  const {
    benefits,
    categoryFilter,
    createBenefit,
    deleteBenefit,
    error,
    isLoading,
    keyword,
    page,
    pageSize,
    setCategoryFilter,
    setKeyword,
    setPage,
    setPageSize,
    setSort,
    sort,
    totalCount,
    totalPages,
    updateBenefit,
  } = useAdminBenefits();
  const { runWithStatus } = useActionStatus();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
  const [deletingBenefitId, setDeletingBenefitId] = useState<number | null>(
    null,
  );
  const [searchDraft, setSearchDraft] = useState(keyword);
  const editingBenefit = benefits.find(
    (benefit) => benefit.benefitId === editingBenefitId,
  );
  const deletingBenefit = benefits.find(
    (benefit) => benefit.benefitId === deletingBenefitId,
  );
  const hasSearchKeyword = keyword.trim().length > 0;
  const rangeStart = totalCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    totalCount === 0
      ? 0
      : Math.min(totalCount, rangeStart + benefits.length - 1);
  const fillerRowCount = isLoading
    ? 0
    : Math.max(0, BENEFIT_MIN_TABLE_ROWS - benefits.length);

  // 입력을 멈추고 잠시 뒤에 검색한다.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft !== keyword) {
        setKeyword(searchDraft);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, searchDraft, setKeyword]);

  const runAction = (
    label: string,
    action: () => Promise<void>,
    fallbackMessage: string,
  ) => {
    runWithStatus(label, action).catch((actionError: unknown) => {
      showToast(toErrorMessage(actionError, fallbackMessage));
    });
  };

  const saveNewBenefit = (input: AdminBenefitRequest) => {
    setIsCreateModalOpen(false);
    runAction(
      "제휴 혜택 등록",
      () => createBenefit(input),
      "제휴 혜택을 등록하지 못했어요.",
    );
  };

  const saveEditedBenefit = (input: AdminBenefitRequest) => {
    if (!editingBenefit) return;

    const { benefitId } = editingBenefit;

    setEditingBenefitId(null);
    runAction(
      "제휴 혜택 수정",
      () => updateBenefit(benefitId, input),
      "제휴 혜택을 수정하지 못했어요.",
    );
  };

  const confirmDelete = () => {
    if (!deletingBenefit) return;

    const { benefitId } = deletingBenefit;

    setDeletingBenefitId(null);
    runAction(
      "제휴 혜택 삭제",
      () => deleteBenefit(benefitId),
      "제휴 혜택을 삭제하지 못했어요.",
    );
  };

  return (
    <div>
      <BenefitManagementHeader
        embedded={embedded}
        onCreate={() => setIsCreateModalOpen(true)}
      />

      <div className="mb-7 grid gap-3 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="브랜드명이나 혜택 이름을 검색하세요"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          {hasSearchKeyword && (
            <Button
              variant="secondary"
              size="sm"
              className="h-12 shrink-0 rounded-2xl"
              onClick={() => {
                setSearchDraft("");
                setKeyword("");
              }}
            >
              초기화
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FilterDropdown
            aria-label="제휴 혜택 정렬"
            className="w-full sm:w-[160px]"
            options={benefitSortOptions}
            value={sort}
            onChange={(nextValue) => setSort(nextValue as BenefitSort)}
          />
          <FilterDropdown
            aria-label="카테고리 필터"
            className="w-full sm:w-[140px]"
            options={benefitCategoryFilterOptions}
            value={categoryFilter}
            onChange={(nextValue) =>
              setCategoryFilter(nextValue as BenefitCategoryFilter)
            }
          />
          <FilterDropdown
            aria-label="페이지당 제휴 혜택 수"
            className="w-full sm:w-[120px]"
            options={benefitPageSizeOptions}
            value={String(pageSize)}
            onChange={(nextValue) => setPageSize(Number(nextValue))}
          />
        </div>
      </div>

      {error && <AdminErrorBanner message={error} />}

      {/* 모바일: 카드 목록 */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <Card>
            <p className="text-text-secondary py-6 text-center text-sm font-semibold">
              제휴 혜택을 불러오고 있어요.
            </p>
          </Card>
        ) : benefits.length === 0 ? (
          <Card>
            <BenefitEmptyState />
          </Card>
        ) : (
          benefits.map((benefit) => (
            <Card key={benefit.benefitId} padding="sm">
              <BenefitSummary benefit={benefit} />
              {onSelectCategory && (
                <button
                  type="button"
                  className="text-brand mt-3 text-xs font-bold"
                  onClick={() => onSelectCategory(benefit.category)}
                >
                  {benefit.category} 제휴점 보기
                </button>
              )}
              <div className="mt-4 flex justify-end gap-1.5">
                <BenefitActions
                  benefit={benefit}
                  onDelete={() => setDeletingBenefitId(benefit.benefitId)}
                  onEdit={() => setEditingBenefitId(benefit.benefitId)}
                  size="sm"
                />
              </div>
            </Card>
          ))
        )}
        {!isLoading && benefits.length > 0 && (
          <AdminPagination
            currentPage={page + 1}
            disabled={isLoading}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage - 1)}
          />
        )}
      </div>

      {/* 데스크톱: 표 */}
      <Card padding="none" className="hidden overflow-hidden md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
            <tr>
              <th className="w-[22%] px-5 py-4 text-left">브랜드</th>
              <th className="px-4 py-4 text-left">혜택</th>
              <th className="w-[120px] px-4 py-4 text-left">카테고리</th>
              <th className="w-[96px] px-4 py-4 text-center">연결 매장</th>
              <th className="w-[128px] px-4 py-4 text-center">수정일</th>
              <th className="w-[140px] px-5 py-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-border-soft divide-y dark:divide-white/10">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-text-secondary h-[480px] text-center text-sm font-semibold"
                >
                  제휴 혜택을 불러오고 있어요.
                </td>
              </tr>
            ) : benefits.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-[480px] px-5 py-0">
                  <BenefitEmptyState />
                </td>
              </tr>
            ) : (
              <>
                {benefits.map((benefit) => (
                  <tr
                    key={benefit.benefitId}
                    className="hover:bg-surface-muted/70 transition dark:hover:bg-white/5"
                  >
                    <td className="truncate px-5 py-4 font-extrabold text-gray-800 dark:text-gray-100">
                      {benefit.brand}
                    </td>
                    <td className="px-4 py-4">
                      <p className="truncate font-bold text-gray-800 dark:text-gray-100">
                        {benefit.name}
                      </p>
                      {benefit.description && (
                        <p className="text-text-secondary mt-1 line-clamp-2 text-xs font-medium break-keep">
                          {benefit.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <BenefitCategoryBadge category={benefit.category} />
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-500">
                      {benefit.storeCount.toLocaleString("ko-KR")}곳
                      {onSelectCategory && (
                        <button
                          type="button"
                          className="text-brand mt-1 block w-full text-xs hover:underline"
                          onClick={() => onSelectCategory(benefit.category)}
                        >
                          업종 매장 보기
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-400">
                      {formatKoreanDate(benefit.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <BenefitActions
                          benefit={benefit}
                          onDelete={() =>
                            setDeletingBenefitId(benefit.benefitId)
                          }
                          onEdit={() => setEditingBenefitId(benefit.benefitId)}
                          size="md"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: fillerRowCount }).map((_, index) => (
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
        {!isLoading && benefits.length > 0 && (
          <div className="border-border-soft flex items-center justify-center border-t px-5 py-4 dark:border-white/10">
            <AdminPagination
              currentPage={page + 1}
              disabled={isLoading}
              totalPages={totalPages}
              onPageChange={(nextPage) => setPage(nextPage - 1)}
            />
          </div>
        )}
      </Card>

      <AdminResultSummary
        keyword={hasSearchKeyword ? keyword : ""}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalCount}
      />

      <BenefitFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSave={saveNewBenefit}
      />

      <BenefitFormModal
        isOpen={editingBenefit !== undefined}
        mode="edit"
        initialValues={editingBenefit}
        onClose={() => setEditingBenefitId(null)}
        onSave={saveEditedBenefit}
      />

      <BenefitDeleteModal
        benefit={deletingBenefit}
        onClose={() => setDeletingBenefitId(null)}
        onDelete={confirmDelete}
      />
    </div>
  );
};

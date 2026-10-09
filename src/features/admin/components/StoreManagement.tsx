"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { AdminErrorBanner } from "@/features/admin/components/AdminErrorBanner";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminResultSummary } from "@/features/admin/components/AdminResultSummary";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { StoreDeleteModal } from "@/features/admin/components/StoreDeleteModal";
import {
  StoreFormModal,
  type StoreInput,
} from "@/features/admin/components/StoreFormModal";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import type { AdminBenefit, AdminStoreType } from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { SearchInput } from "@/shared/ui/SearchInput";
import { showToast } from "@/shared/ui/ToastProvider";

const pageSizeOptions = [20, 50, 100] as const;
const MIN_TABLE_ROWS = 8;
const sortOptions = [
  {
    direction: "desc",
    field: "createdAt",
    label: "최신 등록순",
    value: "createdAt:desc",
  },
  {
    direction: "desc",
    field: "updatedAt",
    label: "최근 수정순",
    value: "updatedAt:desc",
  },
] as const;
const pageSizeFilterOptions = pageSizeOptions.map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));

type StoreManagementProps = {
  storeType?: AdminStoreType;
};

const storeTypeLabels: Record<
  AdminStoreType,
  { emptyName: string; name: string; title: string }
> = {
  PHONE: {
    emptyName: "대리점",
    name: "대리점",
    title: "대리점 관리",
  },
  PARTNER: {
    emptyName: "제휴점",
    name: "제휴점",
    title: "제휴점 관리",
  },
};

export const StoreManagement = ({
  storeType = "PHONE",
}: StoreManagementProps) => {
  const {
    addStore,
    deleteStore,
    getStoreDetail,
    isStoreLoading,
    saveStore,
    setStoreKeyword,
    setStorePage,
    setStorePageSize,
    setStoreSort,
    setStoreTypeFilter,
    storeError,
    storeKeyword,
    storePage,
    storePageSize,
    storeSortDirection,
    storeSortField,
    storeTypeFilter,
    stores,
    storeTotalCount,
    storeTotalPages,
  } = useAdminData();
  const labels = storeTypeLabels[storeType];
  const { runWithStatus } = useActionStatus();
  const [searchDraft, setSearchDraft] = useState(storeKeyword);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<number | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [benefits, setBenefits] = useState<AdminBenefit[]>([]);
  const [benefitError, setBenefitError] = useState<string | null>(null);
  const hasSearchKeyword = storeKeyword.trim().length > 0;
  const isPartnerStore = storeType === "PARTNER";
  const isStoreTypeSynced = storeTypeFilter === storeType;

  const editingStore = editingStoreId
    ? getStoreDetail(editingStoreId)
    : undefined;
  const deletingStore = useMemo(
    () => stores.find((store) => store.storeId === deletingStoreId),
    [deletingStoreId, stores],
  );
  const rangeStart = storeTotalCount === 0 ? 0 : storePage * storePageSize + 1;
  const rangeEnd = Math.min(storeTotalCount, rangeStart + stores.length - 1);
  const shouldShowSkeletonRows = isStoreLoading || !isStoreTypeSynced;
  const visibleSkeletonRows = shouldShowSkeletonRows
    ? Math.min(storePageSize, MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, MIN_TABLE_ROWS - stores.length)
    : 0;
  const sortValue = `${storeSortField}:${storeSortDirection}`;

  useEffect(() => {
    setStoreTypeFilter(storeType);
  }, [setStoreTypeFilter, storeType]);

  useEffect(() => {
    if (!isPartnerStore) {
      return;
    }

    let isCancelled = false;

    void adminStoreService
      .fetchBenefits()
      .then((nextBenefits) => {
        if (!isCancelled) {
          setBenefits(nextBenefits);
          setBenefitError(null);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setBenefitError(
            error instanceof Error
              ? error.message
              : "제휴 브랜드 목록을 불러오지 못했습니다.",
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isPartnerStore]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft !== storeKeyword) {
        setStoreKeyword(searchDraft);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchDraft, setStoreKeyword, storeKeyword]);

  const handleCreate = async (input: StoreInput) => {
    await runWithStatus(`${labels.name} 추가`, () => addStore(input));
    setIsAddModalOpen(false);
  };

  const handleUpdate = async (input: StoreInput) => {
    if (!editingStore) return;

    await runWithStatus(`${labels.name} 수정`, () =>
      saveStore(editingStore.storeId, input),
    );
    setEditingStoreId(null);
  };

  const handleDelete = async () => {
    if (!deletingStore || isDeleteSubmitting) return;

    setIsDeleteSubmitting(true);

    try {
      await runWithStatus(`${labels.name} 삭제`, () =>
        deleteStore(deletingStore.storeId),
      );
      setDeletingStoreId(null);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const openEditModal = (storeId: number) => {
    const storeDetail = getStoreDetail(storeId);

    if (!storeDetail) {
      showToast(`${labels.name} 상세 정보를 불러오지 못했습니다.`);
      return;
    }

    setEditingStoreId(storeId);
  };

  const clearSearch = () => {
    setSearchDraft("");
    setStoreKeyword("");
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
            {labels.title}
          </h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            관리자 API 기준으로 {labels.name} 정보를 추가, 수정, 삭제합니다.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsAddModalOpen(true)}
        >
          {labels.name} 추가
        </Button>
      </div>

      <div className="mb-7 grid gap-3 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder={`${labels.name}명이나 주소를 검색하세요`}
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
            aria-label="매장 정렬"
            className="w-full sm:w-[160px]"
            options={sortOptions}
            value={sortValue}
            onChange={(nextValue) => {
              const selected = sortOptions.find(
                (option) => option.value === nextValue,
              );

              if (!selected) return;
              setStoreSort(selected.field, selected.direction);
            }}
          />
          <FilterDropdown
            aria-label="페이지당 매장 수"
            className="w-full sm:w-[120px]"
            options={pageSizeFilterOptions}
            value={String(storePageSize)}
            onChange={(nextValue) => setStorePageSize(Number(nextValue))}
          />
        </div>
      </div>

      {storeError && <AdminErrorBanner message={storeError} />}
      {isPartnerStore && benefitError && (
        <AdminErrorBanner message={benefitError} />
      )}

      <div className="space-y-3 md:hidden">
        {shouldShowSkeletonRows ? (
          Array.from(
            { length: Math.min(visibleSkeletonRows, 4) },
            (_, index) => (
              <StoreSkeletonCard key={`store-card-skeleton-${index}`} />
            ),
          )
        ) : stores.length === 0 ? (
          <Card>
            <AdminEmptyState
              title="매장이 없습니다."
              description={`검색어를 조정하거나 새 ${labels.emptyName}을 추가해 주세요.`}
            />
          </Card>
        ) : (
          stores.map((store) => (
            <Card key={store.storeId} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                    {store.name}
                  </p>
                  <p className="text-text-secondary mt-2 line-clamp-2 text-xs font-semibold">
                    {store.address}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-gray-400">
                    {isPartnerStore && (
                      <span>
                        {store.brand ?? "-"} · {store.category ?? "-"}
                      </span>
                    )}
                    <span>등록 {formatKoreanDate(store.createdAt)}</span>
                  </div>
                </div>
                <StoreRowActions
                  compact
                  onDelete={() => setDeletingStoreId(store.storeId)}
                  onEdit={() => openEditModal(store.storeId)}
                />
              </div>
            </Card>
          ))
        )}
        {!shouldShowSkeletonRows && stores.length > 0 && (
          <AdminPagination
            currentPage={storePage + 1}
            disabled={isStoreLoading}
            totalPages={storeTotalPages}
            onPageChange={(page) => setStorePage(page - 1)}
          />
        )}
      </div>

      <Card padding="none" className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table
            className={cn(
              "w-full table-fixed border-collapse text-sm",
              isPartnerStore ? "min-w-[1040px]" : "min-w-[860px]",
            )}
          >
            <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
              <tr>
                <th className="w-[88px] px-5 py-4 text-left">ID</th>
                <th className="w-[22%] px-4 py-4 text-left">매장명</th>
                <th className="px-4 py-4 text-left">주소</th>
                {isPartnerStore && (
                  <th className="w-[180px] px-4 py-4 text-left">제휴 브랜드</th>
                )}
                <th className="w-[128px] px-4 py-4 text-center">등록일</th>
                <th className="w-[160px] px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y dark:divide-white/10">
              {shouldShowSkeletonRows ? (
                Array.from({ length: visibleSkeletonRows }, (_, index) => (
                  <StoreSkeletonRow
                    key={`store-skeleton-${index}`}
                    showPartnerColumn={isPartnerStore}
                  />
                ))
              ) : stores.length === 0 ? (
                <tr>
                  <td
                    colSpan={isPartnerStore ? 6 : 5}
                    className="h-[640px] px-5 py-0"
                  >
                    <AdminEmptyState
                      title="조건에 맞는 매장이 없습니다."
                      description={`검색어를 조정하거나 새 ${labels.emptyName}을 추가해 주세요.`}
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {stores.map((store) => (
                    <tr
                      key={store.storeId}
                      className={cn(
                        "hover:bg-surface-muted/70 h-20 transition dark:hover:bg-white/5",
                      )}
                    >
                      <td className="px-5 py-4 font-bold text-gray-400">
                        #{store.storeId}
                      </td>
                      <td className="truncate px-4 py-4 font-extrabold text-gray-800 dark:text-gray-100">
                        {store.name}
                      </td>
                      <td className="truncate px-4 py-4 font-semibold text-gray-500">
                        {store.address}
                      </td>
                      {isPartnerStore && (
                        <td className="truncate px-4 py-4 font-semibold text-gray-500">
                          {store.brand ? (
                            <>
                              <span className="font-extrabold text-gray-700 dark:text-gray-200">
                                {store.brand}
                              </span>
                              <span className="ml-2 text-gray-400">
                                {store.category ?? "-"}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      )}
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatKoreanDate(store.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StoreRowActions
                          onDelete={() => setDeletingStoreId(store.storeId)}
                          onEdit={() => openEditModal(store.storeId)}
                        />
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: fillerRowCount }, (_, index) => (
                    <tr
                      key={`store-filler-${index}`}
                      aria-hidden="true"
                      className="h-20"
                    >
                      <td colSpan={isPartnerStore ? 6 : 5} />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border-soft flex min-h-[65px] items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
          {!shouldShowSkeletonRows && stores.length > 0 && (
            <AdminPagination
              currentPage={storePage + 1}
              disabled={isStoreLoading}
              totalPages={storeTotalPages}
              onPageChange={(page) => setStorePage(page - 1)}
            />
          )}
        </div>
      </Card>

      <AdminResultSummary
        keyword={hasSearchKeyword ? storeKeyword : ""}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={storeTotalCount}
      />

      <StoreFormModal
        key={isAddModalOpen ? "create-open" : "create-closed"}
        isOpen={isAddModalOpen}
        mode="create"
        benefits={benefits}
        storeType={storeType}
        storeLabel={labels.name}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreate}
      />

      <StoreFormModal
        key={editingStore?.storeId ?? "edit-closed"}
        isOpen={editingStore !== undefined}
        mode="edit"
        benefits={benefits}
        store={editingStore}
        storeType={storeType}
        storeLabel={labels.name}
        onClose={() => setEditingStoreId(null)}
        onSave={handleUpdate}
      />

      <StoreDeleteModal
        store={deletingStore}
        storeLabel={labels.name}
        isSubmitting={isDeleteSubmitting}
        onClose={() => setDeletingStoreId(null)}
        onDelete={() => void handleDelete()}
      />
    </div>
  );
};

type StoreRowActionsProps = {
  compact?: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

const StoreRowActions = ({
  compact = false,
  onDelete,
  onEdit,
}: StoreRowActionsProps) => (
  <div
    className={cn("inline-flex items-center", compact ? "gap-1" : "gap-2 pr-3")}
  >
    <Button
      variant="ghost"
      size={compact ? "xs" : "sm"}
      className={cn(
        "rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
      aria-label="매장 수정"
      onClick={onEdit}
    >
      <Edit2 size={compact ? 18 : 30} />
    </Button>
    <Button
      variant="dangerGhost"
      size={compact ? "xs" : "sm"}
      className={cn("rounded-lg p-0", compact ? "h-9 w-9" : "h-12 w-12")}
      aria-label="매장 삭제"
      onClick={onDelete}
    >
      <Trash2 size={compact ? 18 : 30} />
    </Button>
  </div>
);

const StoreSkeletonRow = ({
  showPartnerColumn,
}: {
  showPartnerColumn: boolean;
}) => (
  <tr className="h-20" aria-hidden="true">
    <td className="px-5 py-4">
      <div className="bg-surface-muted h-4 w-12 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-32 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-[min(360px,80%)] animate-pulse rounded-full dark:bg-white/10" />
    </td>
    {showPartnerColumn && (
      <td className="px-4 py-4">
        <div className="bg-surface-muted h-4 w-32 animate-pulse rounded-full dark:bg-white/10" />
      </td>
    )}
    <td className="px-4 py-4">
      <div className="bg-surface-muted mx-auto h-4 w-20 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-5 py-4">
      <div className="mx-auto flex justify-center gap-3">
        <div className="bg-surface-muted h-10 w-10 animate-pulse rounded-lg dark:bg-white/10" />
        <div className="bg-surface-muted h-10 w-10 animate-pulse rounded-lg dark:bg-white/10" />
      </div>
    </td>
  </tr>
);

const StoreSkeletonCard = () => (
  <Card padding="sm" aria-hidden="true">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="bg-surface-muted h-4 w-28 animate-pulse rounded-full dark:bg-white/10" />
        <div className="bg-surface-muted h-3 w-full animate-pulse rounded-full dark:bg-white/10" />
      </div>
      <div className="flex gap-1">
        <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
        <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
      </div>
    </div>
  </Card>
);

"use client";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/shared/config/env";
import { benefitCategoryFilterOptions } from "@/features/admin/benefits/lib/benefitManagementConfig";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import { AdminErrorBanner } from "@/features/admin/common/components/AdminErrorBanner";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { AdminResultSummary } from "@/features/admin/common/components/AdminResultSummary";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";
import { StoreDeleteModal } from "@/features/admin/stores/components/StoreDeleteModal";
import {
  StoreRowActions,
  StoreSkeletonCard,
  StoreManagementTable,
} from "@/features/admin/stores/components/StoreManagementParts";
import {
  StoreFormModal,
  type StoreInput,
} from "@/features/admin/stores/components/StoreFormModal";
import { useActionStatus } from "@/features/admin/common/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/common/context/AdminDataContext";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import type { AdminStoreType } from "@/features/admin/types";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Card } from "@/shared/ui/atoms/Card";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { showToast } from "@/shared/providers/ToastProvider";
import {
  STORE_MIN_TABLE_ROWS,
  storePageSizeFilterOptions,
  storeSortOptions,
  storeTypeLabels,
} from "@/features/admin/stores/lib/storeManagementConfig";

type StoreManagementProps = {
  storeType?: AdminStoreType;
  embedded?: boolean;
};
export const StoreManagement = ({
  storeType = "PHONE",
  embedded = false,
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
    storeCategory,
    storeBenefitId,
    setStoreCategory,
    setStoreBenefitId,
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
  const hasSearchKeyword = storeKeyword.trim().length > 0;
  const isPartnerStore = storeType === "PARTNER";
  const isStoreTypeSynced = storeTypeFilter === storeType;

  const Heading = embedded ? "h2" : "h1";
  const benefitQuery = useQuery({
    queryKey: [...adminQueryKeys.benefitsAll, "options"],
    queryFn: () => adminStoreService.fetchBenefits(),
    enabled: isPartnerStore && Boolean(env.apiBaseUrl),
  });
  const benefits = benefitQuery.data ?? [];
  const selectedBenefit = benefits.find(
    (benefit) => benefit.benefitId === storeBenefitId,
  );
  const benefitError = benefitQuery.error
    ? "제휴 혜택 목록을 불러오지 못했습니다."
    : null;

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
    ? Math.min(storePageSize, STORE_MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, STORE_MIN_TABLE_ROWS - stores.length)
    : 0;
  const sortValue = `${storeSortField}:${storeSortDirection}`;

  useEffect(() => {
    if (storeTypeFilter !== storeType) setStoreTypeFilter(storeType);
  }, [setStoreTypeFilter, storeType, storeTypeFilter]);

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
          <Heading
            className={
              embedded
                ? "text-lg font-bold text-gray-950 dark:text-white"
                : "text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white"
            }
          >
            {labels.title}
          </Heading>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            {labels.name} 정보를 추가·수정하고 연결된 혜택을 관리합니다.
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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {isPartnerStore && storeBenefitId !== undefined && (
            <button
              type="button"
              onClick={() => setStoreBenefitId(undefined)}
              className="border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 inline-flex h-12 max-w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm font-bold transition"
              aria-label="연결 혜택 필터 해제"
            >
              <span className="truncate">
                {selectedBenefit
                  ? `${selectedBenefit.brand} · ${selectedBenefit.name}`
                  : `선택한 혜택 #${storeBenefitId}`}
              </span>
              <X size={15} className="shrink-0" aria-hidden="true" />
            </button>
          )}
          {isPartnerStore && (
            <FilterDropdown
              aria-label="제휴 업종 필터"
              className="w-full sm:w-[160px]"
              options={benefitCategoryFilterOptions}
              value={storeCategory ?? "ALL"}
              onChange={(value) =>
                setStoreCategory(value === "ALL" ? undefined : value)
              }
            />
          )}
          <FilterDropdown
            aria-label="매장 정렬"
            className="w-full sm:w-[160px]"
            options={storeSortOptions}
            value={sortValue}
            onChange={(nextValue) => {
              const selected = storeSortOptions.find(
                (option) => option.value === nextValue,
              );

              if (!selected) return;
              setStoreSort(selected.field, selected.direction);
            }}
          />
          <FilterDropdown
            aria-label="페이지당 매장 수"
            className="w-full sm:w-[120px]"
            options={storePageSizeFilterOptions}
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

      <StoreManagementTable
        stores={stores}
        isPartnerStore={isPartnerStore}
        emptyName={labels.emptyName}
        shouldShowSkeletonRows={shouldShowSkeletonRows}
        visibleSkeletonRows={visibleSkeletonRows}
        fillerRowCount={fillerRowCount}
        storePage={storePage}
        isStoreLoading={isStoreLoading}
        storeTotalPages={storeTotalPages}
        onPageChange={setStorePage}
        onEdit={openEditModal}
        onDelete={setDeletingStoreId}
      />

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

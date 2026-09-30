"use client";

import { ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { AdminField } from "@/features/admin/components/AdminField";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import type { AdminStoreDetail } from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { SearchInput } from "@/shared/ui/SearchInput";
import { showToast } from "@/shared/ui/ToastProvider";

type StoreInput = Omit<AdminStoreDetail, "createdAt" | "storeId" | "updatedAt">;

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
  {
    direction: "asc",
    field: "name",
    label: "매장명순",
    value: "name:asc",
  },
] as const;
const pageSizeFilterOptions = pageSizeOptions.map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));

export const StoreManagement = () => {
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
    storeError,
    storeKeyword,
    storePage,
    storePageSize,
    storeSortDirection,
    storeSortField,
    stores,
    storeTotalCount,
    storeTotalPages,
  } = useAdminData();
  const { runWithStatus } = useActionStatus();
  const [searchDraft, setSearchDraft] = useState(storeKeyword);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<number | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const hasSearchKeyword = storeKeyword.trim().length > 0;

  const editingStore = editingStoreId
    ? getStoreDetail(editingStoreId)
    : undefined;
  const deletingStore = useMemo(
    () => stores.find((store) => store.storeId === deletingStoreId),
    [deletingStoreId, stores],
  );
  const rangeStart = storeTotalCount === 0 ? 0 : storePage * storePageSize + 1;
  const rangeEnd = Math.min(storeTotalCount, rangeStart + stores.length - 1);
  const shouldShowSkeletonRows = isStoreLoading;
  const visibleSkeletonRows = shouldShowSkeletonRows
    ? Math.min(storePageSize, MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, MIN_TABLE_ROWS - stores.length)
    : 0;
  const sortValue = `${storeSortField}:${storeSortDirection}`;

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
    await runWithStatus("매장 추가", () => addStore(input));
    setIsAddModalOpen(false);
  };

  const handleUpdate = async (input: StoreInput) => {
    if (!editingStore) return;

    await runWithStatus("매장 수정", () =>
      saveStore(editingStore.storeId, input),
    );
    setEditingStoreId(null);
  };

  const handleDelete = async () => {
    if (!deletingStore || isDeleteSubmitting) return;

    setIsDeleteSubmitting(true);

    try {
      await runWithStatus("매장 삭제", () =>
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
      showToast("매장 상세 정보를 불러오지 못했습니다.");
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
            매장 관리
          </h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            관리자 API 기준으로 매장 정보를 추가, 수정, 삭제합니다.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsAddModalOpen(true)}
        >
          매장 추가
        </Button>
      </div>

      <div className="mb-7 grid gap-3 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="매장명이나 주소를 검색하세요"
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

      {storeError && (
        <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {storeError}
        </div>
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
              description="검색어를 조정하거나 새 매장을 추가해 주세요."
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
                    <span>등록 {formatDate(store.createdAt)}</span>
                    <span>수정 {formatDate(store.updatedAt)}</span>
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
          <StorePagination
            currentPage={storePage + 1}
            disabled={isStoreLoading}
            totalPages={storeTotalPages}
            onPageChange={(page) => setStorePage(page - 1)}
          />
        )}
      </div>

      <Card padding="none" className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed border-collapse text-sm">
            <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
              <tr>
                <th className="w-[88px] px-5 py-4 text-left">ID</th>
                <th className="w-[22%] px-4 py-4 text-left">매장명</th>
                <th className="px-4 py-4 text-left">주소</th>
                <th className="w-[128px] px-4 py-4 text-center">등록일</th>
                <th className="w-[128px] px-4 py-4 text-center">수정일</th>
                <th className="w-[160px] px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y dark:divide-white/10">
              {shouldShowSkeletonRows ? (
                Array.from({ length: visibleSkeletonRows }, (_, index) => (
                  <StoreSkeletonRow key={`store-skeleton-${index}`} />
                ))
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-[640px] px-5 py-0">
                    <AdminEmptyState
                      title="조건에 맞는 매장이 없습니다."
                      description="검색어를 조정하거나 새 매장을 추가해 주세요."
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
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatDate(store.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatDate(store.updatedAt)}
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
                      <td colSpan={6} />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border-soft flex min-h-[65px] items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
          {!shouldShowSkeletonRows && stores.length > 0 && (
            <StorePagination
              currentPage={storePage + 1}
              disabled={isStoreLoading}
              totalPages={storeTotalPages}
              onPageChange={(page) => setStorePage(page - 1)}
            />
          )}
        </div>
      </Card>

      <p className="text-text-secondary mt-4 text-sm font-bold">
        {hasSearchKeyword && `"${storeKeyword.trim()}" 검색 결과 `}
        {rangeStart.toLocaleString("ko-KR")}-{rangeEnd.toLocaleString("ko-KR")}{" "}
        / 총 {storeTotalCount.toLocaleString("ko-KR")}개
      </p>

      <StoreFormModal
        key={isAddModalOpen ? "create-open" : "create-closed"}
        isOpen={isAddModalOpen}
        mode="create"
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreate}
      />

      <StoreFormModal
        key={editingStore?.storeId ?? "edit-closed"}
        isOpen={editingStore !== undefined}
        mode="edit"
        store={editingStore}
        onClose={() => setEditingStoreId(null)}
        onSave={handleUpdate}
      />

      <Modal
        isOpen={deletingStore !== undefined}
        onClose={() => setDeletingStoreId(null)}
        title="매장을 삭제할까요?"
        description={
          deletingStore
            ? `#${deletingStore.storeId} ${deletingStore.name} 매장이 관리자 목록에서 삭제됩니다.`
            : "선택한 매장이 삭제됩니다."
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingStoreId(null)}
              disabled={isDeleteSubmitting}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleteSubmitting}
              onClick={() => void handleDelete()}
            >
              삭제
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {deletingStore && (
            <div className="bg-surface-muted rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
              <p>{deletingStore.name}</p>
              <p className="text-text-secondary mt-1 text-xs">
                {deletingStore.address}
              </p>
            </div>
          )}
          <p className="text-text-secondary text-sm leading-6 font-semibold">
            삭제 후에는 목록에서 바로 사라집니다.
          </p>
        </div>
      </Modal>
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

const StoreSkeletonRow = () => (
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
    <td className="px-4 py-4">
      <div className="bg-surface-muted mx-auto h-4 w-20 animate-pulse rounded-full dark:bg-white/10" />
    </td>
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

type StorePaginationProps = {
  currentPage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  totalPages: number;
};

const StorePagination = ({
  currentPage,
  disabled = false,
  onPageChange,
  totalPages,
}: StorePaginationProps) => {
  const pages = getVisiblePages(currentPage, totalPages);
  const [jumpValue, setJumpValue] = useState("");

  const handleJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPage = Number(jumpValue);

    if (!Number.isInteger(nextPage)) return;

    onPageChange(Math.min(totalPages, Math.max(1, nextPage)));
    setJumpValue("");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-2 md:pt-0">
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === 1 || disabled}
          aria-label="이전 페이지"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={15} />
        </Button>
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-1 text-sm font-extrabold text-gray-400"
            >
              ...
            </span>
          ) : (
            <PaginationPageButton
              key={page}
              disabled={disabled}
              isActive={page === currentPage}
              page={page}
              onClick={() => onPageChange(page)}
            />
          ),
        )}
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === totalPages || disabled}
          aria-label="다음 페이지"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight size={15} />
        </Button>
      </div>

      {totalPages > 7 && (
        <form className="flex items-center gap-1.5" onSubmit={handleJumpSubmit}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            disabled={disabled}
            placeholder="페이지"
            onChange={(event) => setJumpValue(event.target.value)}
            className="border-border focus:border-brand h-8 w-20 rounded-lg border bg-white px-2 text-center text-xs font-bold text-gray-700 transition outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <Button
            variant="secondary"
            size="xs"
            type="submit"
            disabled={disabled || !jumpValue}
            className="h-8 rounded-lg px-2"
          >
            이동
          </Button>
        </form>
      )}
    </div>
  );
};

type PaginationItem = number | "ellipsis";

const getVisiblePages = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  const pages: PaginationItem[] = [1];

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
};

type PaginationPageButtonProps = {
  disabled?: boolean;
  isActive: boolean;
  onClick: () => void;
  page: number;
};

const PaginationPageButton = ({
  disabled,
  isActive,
  onClick,
  page,
}: PaginationPageButtonProps) => (
  <button
    type="button"
    aria-label={`${page}페이지`}
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-extrabold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white",
    )}
  >
    {page}
  </button>
);

type StoreFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (input: StoreInput) => Promise<void>;
  store?: AdminStoreDetail;
};

const StoreFormModal = ({
  isOpen,
  mode,
  onClose,
  onSave,
  store,
}: StoreFormModalProps) => {
  const formId = mode === "create" ? "store-create-form" : "store-edit-form";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSave(readStoreForm(event.currentTarget));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "매장 정보를 저장하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "매장 추가" : `${store?.name ?? "매장"} 수정`}
      description="백엔드 관리자 매장 API에 저장할 정보를 입력해 주세요."
      size="lg"
    >
      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <AdminField
          label="매장명"
          name="name"
          defaultValue={store?.name}
          placeholder="예: VITA 강남점"
          className="sm:col-span-2"
          required
        />
        <AdminField
          label="주소"
          name="address"
          defaultValue={store?.address}
          placeholder="예: 서울 강남구 테헤란로 111"
          className="sm:col-span-2"
          required
        />
        <AdminField
          label="위도"
          name="lat"
          inputMode="decimal"
          defaultValue={store ? String(store.lat) : undefined}
          placeholder="37.2660"
          required
          step="any"
          type="number"
        />
        <AdminField
          label="경도"
          name="lng"
          inputMode="decimal"
          defaultValue={store ? String(store.lng) : undefined}
          placeholder="127.0000"
          required
          step="any"
          type="number"
        />
        <AdminField
          label="운영시간"
          name="businessHours"
          defaultValue={store?.businessHours}
          placeholder="예: 10:00~20:00"
        />
        <AdminField
          label="전화번호"
          name="phone"
          defaultValue={store?.phone}
          placeholder="예: 02-1234-5678"
        />
        <AdminField
          label="상담 가능 업무"
          name="consultServices"
          defaultValue={store?.consultServices.join(", ")}
          placeholder="휴대폰상담, 요금제변경"
          className="sm:col-span-2"
        />
        <AdminField
          label="제공 가능 서비스"
          name="providedServices"
          defaultValue={store?.providedServices.join(", ")}
          placeholder="유심발급, 기기변경"
          className="sm:col-span-2"
        />
      </form>

      {errorMessage && (
        <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button size="sm" form={formId} type="submit" isLoading={isSubmitting}>
          {mode === "create" ? "추가" : "저장"}
        </Button>
      </div>
    </Modal>
  );
};

const readStoreForm = (form: HTMLFormElement): StoreInput => {
  const formData = new FormData(form);

  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    lat: parseCoordinate(formData.get("lat")),
    lng: parseCoordinate(formData.get("lng")),
    businessHours: String(formData.get("businessHours") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    consultServices: toServiceArray(formData.get("consultServices")),
    providedServices: toServiceArray(formData.get("providedServices")),
  };
};

const parseCoordinate = (value: FormDataEntryValue | string | null) => {
  const coordinate = Number(String(value ?? "").trim());

  if (!Number.isFinite(coordinate)) {
    throw new Error("좌표는 숫자로 입력해 주세요.");
  }

  return coordinate;
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const toServiceArray = (value: FormDataEntryValue | string | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

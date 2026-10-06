"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { AdminControlledField } from "@/features/admin/components/AdminControlledField";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/admin/lib/adminFormSchemas";
import type {
  AdminBenefit,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { SearchInput } from "@/shared/ui/SearchInput";
import { showToast } from "@/shared/ui/ToastProvider";

type StoreInput = Omit<
  AdminStoreDetail,
  | "brand"
  | "category"
  | "benefitName"
  | "createdAt"
  | "storeId"
  | "storeType"
  | "updatedAt"
>;

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

      {storeError && (
        <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {storeError}
        </div>
      )}
      {isPartnerStore && benefitError && (
        <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {benefitError}
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

      <p className="text-text-secondary mt-4 text-sm font-bold">
        {hasSearchKeyword && `"${storeKeyword.trim()}" 검색 결과 `}
        {rangeStart.toLocaleString("ko-KR")}-{rangeEnd.toLocaleString("ko-KR")}{" "}
        / 총 {storeTotalCount.toLocaleString("ko-KR")}개
      </p>

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

      <Modal
        isOpen={deletingStore !== undefined}
        onClose={() => setDeletingStoreId(null)}
        title={`${labels.name}을 삭제할까요?`}
        description={
          deletingStore
            ? `#${deletingStore.storeId} ${deletingStore.name} ${labels.name}이 관리자 목록에서 삭제됩니다.`
            : `선택한 ${labels.name}이 삭제됩니다.`
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

type StoreFormModalProps = {
  benefits: AdminBenefit[];
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (input: StoreInput) => Promise<void>;
  storeLabel: string;
  storeType: AdminStoreType;
  store?: AdminStoreDetail;
};

const StoreFormModal = ({
  benefits,
  isOpen,
  mode,
  onClose,
  onSave,
  store,
  storeLabel,
  storeType,
}: StoreFormModalProps) => {
  const formId = mode === "create" ? "store-create-form" : "store-edit-form";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPartnerStore = storeType === "PARTNER";
  const benefitOptions = benefits.map((benefit) => ({
    label: `${benefit.brand} · ${benefit.name}`,
    value: String(benefit.benefitId),
  }));
  const placeholders = isPartnerStore
    ? {
        businessHours: "예: 09:00~18:00",
        consultServices: "입장권 문의, 예약 변경",
        name: "예: 어진월드 어드벤처",
        phone: "예: 02-9876-5432",
        providedServices: "제휴 할인, 현장 결제",
        address: "예: 서울 송파구 올림픽로 240",
      }
    : {
        businessHours: "예: 10:00~20:00",
        consultServices: "휴대폰상담, 요금제변경",
        name: "예: VITA 강남점",
        phone: "예: 02-1234-5678",
        providedServices: "유심발급, 기기변경",
        address: "예: 서울 강남구 테헤란로 111",
      };
  const fieldLabels = isPartnerStore
    ? {
        consultServices: "이용 안내",
        providedServices: "제휴 제공 내용",
      }
    : {
        consultServices: "상담 가능 업무",
        providedServices: "제공 가능 서비스",
      };
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<StoreFormValues>({
    defaultValues: {
      address: store?.address ?? "",
      benefitId: store?.benefitId ? String(store.benefitId) : "",
      businessHours: store?.businessHours ?? "",
      consultServices: store?.consultServices.join(", ") ?? "",
      lat: store ? String(store.lat) : "",
      lng: store ? String(store.lng) : "",
      name: store?.name ?? "",
      phone: store?.phone ?? "",
      providedServices: store?.providedServices.join(", ") ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(storeFormSchema),
  });
  const selectedBenefitId = useWatch({ control, name: "benefitId" });
  const canSubmit = isValid && (!isPartnerStore || Boolean(selectedBenefitId));
  const validationMessage =
    errorMessage ??
    errors.benefitId?.message ??
    errors.businessHours?.message ??
    errors.phone?.message;

  useEffect(() => {
    reset({
      address: store?.address ?? "",
      benefitId: store?.benefitId ? String(store.benefitId) : "",
      businessHours: store?.businessHours ?? "",
      consultServices: store?.consultServices.join(", ") ?? "",
      lat: store ? String(store.lat) : "",
      lng: store ? String(store.lng) : "",
      name: store?.name ?? "",
      phone: store?.phone ?? "",
      providedServices: store?.providedServices.join(", ") ?? "",
    });
  }, [reset, store]);

  const submitStore = async (values: StoreFormValues) => {
    setErrorMessage(null);

    if (isPartnerStore && !values.benefitId?.trim()) {
      const message = "제휴 브랜드를 선택해 주세요.";
      setError("benefitId", { message, type: "manual" });
      showToast(message);
      return;
    }

    clearErrors("benefitId");
    setIsSubmitting(true);

    try {
      await onSave({
        address: values.address.trim(),
        benefitId: parseOptionalNumber(values.benefitId),
        businessHours: values.businessHours?.trim() ?? "",
        consultServices: toServiceArray(values.consultServices),
        lat: Number(values.lat.trim()),
        lng: Number(values.lng.trim()),
        name: values.name.trim(),
        phone: values.phone?.trim() ?? "",
        providedServices: toServiceArray(values.providedServices),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `${storeLabel} 정보를 저장하지 못했습니다.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInvalidSubmit = (formErrors: FieldErrors<StoreFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;

    showToast(
      typeof firstMessage === "string"
        ? firstMessage
        : `${storeLabel} 정보를 다시 확인해 주세요.`,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? `${storeLabel} 추가`
          : `${store?.name ?? storeLabel} 수정`
      }
      description={`백엔드 관리자 API에 저장할 ${storeLabel} 정보를 입력해 주세요.`}
      size="lg"
      className="max-h-[calc(100svh-48px)] overflow-y-auto"
    >
      {mode === "edit" && store && (
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold text-gray-400 dark:bg-white/5">
          <span>등록일 {formatKoreanDate(store.createdAt)}</span>
          <span>
            수정일{" "}
            {store.updatedAt
              ? formatKoreanDate(store.updatedAt)
              : "수정 이력 없음"}
          </span>
        </div>
      )}

      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(submitStore, handleInvalidSubmit)}
      >
        <AdminControlledField
          control={control}
          name="name"
          label={`${storeLabel}명`}
          placeholder={placeholders.name}
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="address"
          label="주소"
          placeholder={placeholders.address}
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="lat"
          label="위도"
          inputMode="decimal"
          placeholder="37.2660"
          required
          step="any"
          type="number"
        />
        <AdminControlledField
          control={control}
          name="lng"
          label="경도"
          inputMode="decimal"
          placeholder="127.0000"
          required
          step="any"
          type="number"
        />
        <AdminControlledField
          control={control}
          name="businessHours"
          label="운영시간"
          placeholder={placeholders.businessHours}
        />
        <AdminControlledField
          control={control}
          name="phone"
          label="전화번호"
          placeholder={placeholders.phone}
        />
        {isPartnerStore && (
          <AdminControlledField
            control={control}
            name="benefitId"
            label="제휴 브랜드"
            options={benefitOptions}
            placeholder="제휴 브랜드 선택"
            required
            className="sm:col-span-2"
            description="백엔드 제휴 혜택 API의 benefitId로 연결됩니다."
          />
        )}
        <AdminControlledField
          control={control}
          name="consultServices"
          label={fieldLabels.consultServices}
          placeholder={placeholders.consultServices}
          className="sm:col-span-2"
        />
        <AdminControlledField
          control={control}
          name="providedServices"
          label={fieldLabels.providedServices}
          placeholder={placeholders.providedServices}
          className="sm:col-span-2"
        />
      </form>

      {validationMessage && (
        <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {validationMessage}
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
        <Button
          size="sm"
          form={formId}
          type="submit"
          disabled={!canSubmit}
          isLoading={isSubmitting}
        >
          {mode === "create" ? "추가" : "저장"}
        </Button>
      </div>
    </Modal>
  );
};

const parseOptionalNumber = (value?: string) => {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue)) {
    throw new Error("제휴 브랜드를 다시 선택해 주세요.");
  }

  return numberValue;
};

const toServiceArray = (value?: string) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

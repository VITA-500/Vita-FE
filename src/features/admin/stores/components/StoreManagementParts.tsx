import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { AdminTableShell } from "@/features/admin/common/components/AdminTableShell";
import { formatKoreanDate } from "@/shared/lib/date";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/Button";
import { Card } from "@/shared/ui/atoms/Card";
import type { AdminStore } from "@/entities/store";

export type StoreRowActionsProps = {
  compact?: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

export const StoreRowActions = ({
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
        compact ? "h-9 w-9" : "h-10 w-10",
      )}
      aria-label="매장 수정"
      onClick={onEdit}
    >
      <Edit2 size={compact ? 17 : 18} />
    </Button>
    <Button
      variant="dangerGhost"
      size={compact ? "xs" : "sm"}
      className={cn("rounded-lg p-0", compact ? "h-9 w-9" : "h-10 w-10")}
      aria-label="매장 삭제"
      onClick={onDelete}
    >
      <Trash2 size={compact ? 17 : 18} />
    </Button>
  </div>
);

export const StoreSkeletonRow = ({
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

export const StoreSkeletonCard = () => (
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

export const StoreManagementTable = ({
  stores,
  isPartnerStore,
  emptyName,
  shouldShowSkeletonRows,
  visibleSkeletonRows,
  fillerRowCount,
  storePage,
  isStoreLoading,
  storeTotalPages,
  onPageChange,
  onEdit,
  onDelete,
}: {
  stores: AdminStore[];
  isPartnerStore: boolean;
  emptyName: string;
  shouldShowSkeletonRows: boolean;
  visibleSkeletonRows: number;
  fillerRowCount: number;
  storePage: number;
  isStoreLoading: boolean;
  storeTotalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => (
  <AdminTableShell
    className="hidden md:block"
    paginationClassName="min-h-[65px]"
    pagination={
      !shouldShowSkeletonRows && stores.length > 0 ? (
        <AdminPagination
          currentPage={storePage + 1}
          disabled={isStoreLoading}
          totalPages={storeTotalPages}
          onPageChange={(page) => onPageChange(page - 1)}
        />
      ) : null
    }
  >
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
                description={`검색어를 조정하거나 새 ${emptyName}을 추가해 주세요.`}
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
                    onDelete={() => onDelete(store.storeId)}
                    onEdit={() => onEdit(store.storeId)}
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
  </AdminTableShell>
);

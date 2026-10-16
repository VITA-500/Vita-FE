import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

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

import { Edit2, Eye, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";

type FaqRowActionsProps = {
  compact?: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export const FaqRowActions = ({
  compact = false,
  isActive,
  onActivate,
  onDelete,
  onEdit,
}: FaqRowActionsProps) => (
  <div className="inline-flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      size={compact ? "xs" : "sm"}
      className={`rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white ${compact ? "h-9 w-9" : "h-12 w-12"}`}
      aria-label="FAQ 수정"
      onClick={onEdit}
    >
      <Edit2 size={compact ? 20 : 30} />
    </Button>
    {isActive ? (
      <Button
        variant="dangerGhost"
        size={compact ? "xs" : "sm"}
        className={`rounded-lg p-0 ${compact ? "h-9 w-9" : "h-12 w-12"}`}
        aria-label="FAQ 삭제"
        onClick={onDelete}
      >
        <Trash2 size={compact ? 20 : 30} />
      </Button>
    ) : (
      <Button
        variant="ghost"
        size={compact ? "xs" : "sm"}
        className={`rounded-lg p-0 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300 ${compact ? "h-9 w-9" : "h-12 w-12"}`}
        aria-label="FAQ 활성화"
        onClick={onActivate}
      >
        <Eye size={compact ? 20 : 30} />
      </Button>
    )}
  </div>
);

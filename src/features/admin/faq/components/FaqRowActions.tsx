import { Ban, Edit2, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";

type FaqRowActionsProps = {
  compact?: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
};

export const FaqRowActions = ({
  compact = false,
  isActive,
  onActivate,
  onDeactivate,
  onEdit,
}: FaqRowActionsProps) => (
  <div className="inline-flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      size={compact ? "xs" : "sm"}
      className={`rounded-lg p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white ${compact ? "h-9 w-9" : "h-10 w-10"}`}
      aria-label="FAQ 수정"
      title="FAQ 수정"
      onClick={onEdit}
    >
      <Edit2 size={compact ? 17 : 18} />
    </Button>
    {isActive ? (
      <Button
        variant="ghost"
        size={compact ? "xs" : "sm"}
        className={`rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
        aria-label="FAQ 비활성화"
        title="FAQ 비활성화"
        onClick={onDeactivate}
      >
        <Ban size={compact ? 17 : 18} />
      </Button>
    ) : (
      <Button
        variant="ghost"
        size={compact ? "xs" : "sm"}
        className={`rounded-lg p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 ${compact ? "h-9 w-9" : "h-10 w-10"}`}
        aria-label="FAQ 활성화"
        title="FAQ 활성화"
        onClick={onActivate}
      >
        <RotateCcw size={compact ? 17 : 18} />
      </Button>
    )}
  </div>
);

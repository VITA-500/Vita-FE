import { Card } from "@/shared/ui/Card";

export const FaqSkeletonRow = () => (
  <tr className="h-20" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => (
      <td className="px-4 py-4" key={index}>
        <div
          className={`bg-surface-muted h-4 animate-pulse rounded-full dark:bg-white/10 ${index === 0 ? "w-12" : index === 2 ? "w-24" : "mx-auto w-20"}`}
        />
      </td>
    ))}
  </tr>
);

export const FaqSkeletonCard = () => (
  <Card padding="sm" aria-hidden="true">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="bg-surface-muted h-4 w-full animate-pulse rounded-full dark:bg-white/10" />
        <div className="bg-surface-muted h-3 w-2/3 animate-pulse rounded-full dark:bg-white/10" />
      </div>
    </div>
    <div className="mt-4 flex justify-end gap-1.5">
      <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
      <div className="bg-surface-muted h-9 w-9 animate-pulse rounded-lg dark:bg-white/10" />
    </div>
  </Card>
);

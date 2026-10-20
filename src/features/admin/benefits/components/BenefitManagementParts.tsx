import { Modal } from "@/shared/ui/organisms/Modal";
import { ChevronRight, Edit2, Trash2, Plus } from "lucide-react";
import type { AdminBenefitDetail } from "@/features/admin/types";
import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import { renderBenefitCategoryIcon } from "@/entities/benefit";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
export const BenefitEmptyState = () => (
  <AdminEmptyState
    title="조건에 맞는 제휴 혜택이 없습니다."
    description="검색어와 카테고리 필터를 조정하거나 새 제휴 혜택을 등록해 주세요."
  />
);

export const BenefitCategoryBadge = ({ category }: { category: string }) => (
  <span className="bg-brand/10 text-brand inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-extrabold">
    {renderBenefitCategoryIcon(category, 12)}
    {category}
  </span>
);

export const BenefitSummary = ({
  benefit,
  onSelectBenefit,
}: {
  benefit: AdminBenefitDetail;
  onSelectBenefit?: (benefitId: number) => void;
}) => (
  <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
        {benefit.brand}
      </p>
      <BenefitCategoryBadge category={benefit.category} />
    </div>
    <p className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">
      {benefit.name}
    </p>
    {benefit.description && (
      <p className="text-text-secondary mt-1 line-clamp-2 text-xs font-medium break-keep">
        {benefit.description}
      </p>
    )}
    <div className="text-text-secondary mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
      <BenefitStoreCount benefit={benefit} onSelectBenefit={onSelectBenefit} />
      <span>수정 {formatKoreanDate(benefit.updatedAt)}</span>
    </div>
  </div>
);

export const BenefitStoreCount = ({
  benefit,
  onSelectBenefit,
}: {
  benefit: AdminBenefitDetail;
  onSelectBenefit?: (benefitId: number) => void;
}) =>
  onSelectBenefit ? (
    <button
      type="button"
      aria-label={`${benefit.brand} ${benefit.name} 연결 매장 보기`}
      onClick={() => onSelectBenefit(benefit.benefitId)}
      className="group text-text-secondary hover:text-brand focus-visible:ring-brand/30 inline-flex min-h-8 cursor-pointer items-center gap-0.5 rounded-md px-1.5 font-bold tabular-nums transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-white/10"
    >
      <span>{benefit.storeCount.toLocaleString("ko-KR")}곳</span>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5"
      />
    </button>
  ) : (
    <span>{benefit.storeCount.toLocaleString("ko-KR")}곳</span>
  );

/**
 * 수정·삭제 버튼. 연결된 제휴 매장이 있으면 BE가 삭제를 막으므로(409) 삭제 버튼을 끄고 이유를 툴팁으로 알려준다.
 * (비활성 버튼은 마우스 이벤트를 받지 않아 툴팁은 감싼 span에 둔다)
 */
export const BenefitActions = ({
  benefit,
  onDelete,
  onEdit,
  size,
}: {
  benefit: AdminBenefitDetail;
  onDelete: () => void;
  onEdit: () => void;
  size: "sm" | "md";
}) => {
  const buttonClassName =
    size === "md" ? "h-12 w-12 rounded-lg p-0" : "h-9 w-9 rounded-lg p-0";
  const iconSize = size === "md" ? 26 : 20;
  const canDelete = benefit.storeCount === 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`${buttonClassName} text-gray-400 hover:text-gray-700 dark:hover:text-white`}
        aria-label={`${benefit.brand} 혜택 수정`}
        onClick={onEdit}
      >
        <Edit2 size={iconSize} />
      </Button>
      <span
        title={
          canDelete
            ? undefined
            : `연결된 제휴 매장 ${benefit.storeCount}곳의 연결을 먼저 바꿔야 삭제할 수 있어요.`
        }
      >
        <Button
          variant="dangerGhost"
          size="sm"
          className={buttonClassName}
          aria-label={`${benefit.brand} 혜택 삭제`}
          disabled={!canDelete}
          onClick={onDelete}
        >
          <Trash2 size={iconSize} />
        </Button>
      </span>
    </>
  );
};

export const BenefitDeleteModal = ({
  benefit,
  onClose,
  onDelete,
}: {
  benefit?: AdminBenefitDetail;
  onClose: () => void;
  onDelete: () => void;
}) => (
  <Modal
    isOpen={benefit !== undefined}
    onClose={onClose}
    title="제휴 혜택을 삭제할까요?"
    description={
      benefit
        ? `${benefit.brand} · ${benefit.name} 혜택이 삭제됩니다.`
        : undefined
    }
    size="sm"
    className="break-keep"
    actions={
      <>
        <Button variant="ghost" size="sm" onClick={onClose}>
          취소
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          삭제
        </Button>
      </>
    }
  >
    <p className="text-text-secondary text-sm leading-6 font-semibold">
      삭제한 혜택은 되돌릴 수 없어요.
    </p>
  </Modal>
);

export const BenefitManagementHeader = ({
  embedded,
  onCreate,
}: {
  embedded: boolean;
  onCreate: () => void;
}) => {
  const Heading = embedded ? "h2" : "h1";
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Heading
          className={
            embedded
              ? "text-lg font-bold text-gray-950 dark:text-white"
              : "text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white"
          }
        >
          제휴 서비스 관리
        </Heading>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          제휴 브랜드와 혜택을 관리합니다. 등록한 혜택은 제휴점 관리에서 매장에
          연결할 수 있어요.
        </p>
      </div>

      <Button size="sm" leftIcon={<Plus size={16} />} onClick={onCreate}>
        제휴 혜택 등록
      </Button>
    </div>
  );
};

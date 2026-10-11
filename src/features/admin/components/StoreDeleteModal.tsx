"use client";

import type { AdminStore } from "@/features/admin/types";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

type StoreDeleteModalProps = {
  isSubmitting: boolean;
  onClose: () => void;
  onDelete: () => void;
  store?: AdminStore;
  storeLabel: string;
};

export const StoreDeleteModal = ({
  isSubmitting,
  onClose,
  onDelete,
  store,
  storeLabel,
}: StoreDeleteModalProps) => (
  <Modal
    isOpen={store !== undefined}
    onClose={onClose}
    title={`${storeLabel}을 삭제할까요?`}
    description={
      store
        ? `#${store.storeId} ${store.name} ${storeLabel}이 관리자 목록에서 삭제됩니다.`
        : `선택한 ${storeLabel}이 삭제됩니다.`
    }
    actions={
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          variant="danger"
          size="sm"
          isLoading={isSubmitting}
          onClick={onDelete}
        >
          삭제
        </Button>
      </>
    }
  >
    <div className="space-y-3">
      {store && (
        <div className="bg-surface-muted rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
          <p>{store.name}</p>
          <p className="text-text-secondary mt-1 text-xs">{store.address}</p>
        </div>
      )}
      <p className="text-text-secondary text-sm leading-6 font-semibold">
        삭제 후에는 목록에서 바로 사라집니다.
      </p>
    </div>
  </Modal>
);

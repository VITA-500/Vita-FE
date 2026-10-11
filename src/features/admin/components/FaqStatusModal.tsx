"use client";

import type { AdminFaq } from "@/features/admin/types";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

type FaqStatusModalProps = {
  faq?: AdminFaq;
  mode: "activate" | "delete";
  onClose: () => void;
  onConfirm: () => void;
};

const modalCopy = {
  activate: {
    confirmLabel: "활성화",
    description: "활성화하면 FAQ가 다시 노출됩니다.",
    title: "FAQ를 활성화할까요?",
  },
  delete: {
    confirmLabel: "삭제",
    description: "삭제하면 FAQ가 비활성 상태로 전환됩니다.",
    title: "FAQ를 삭제할까요?",
  },
} as const;

export const FaqStatusModal = ({
  faq,
  mode,
  onClose,
  onConfirm,
}: FaqStatusModalProps) => {
  const copy = modalCopy[mode];

  return (
    <Modal
      isOpen={faq !== undefined}
      onClose={onClose}
      title={copy.title}
      description={
        <span className="whitespace-nowrap">{copy.description}</span>
      }
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            variant={mode === "delete" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </Button>
        </>
      }
    >
      {faq && (
        <p className="bg-surface-muted rounded-2xl p-4 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
          {faq.question}
        </p>
      )}
    </Modal>
  );
};

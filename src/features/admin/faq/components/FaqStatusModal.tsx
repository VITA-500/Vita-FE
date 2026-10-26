"use client";

import { Button } from "@/shared/ui/atoms/Button";
import { Modal } from "@/shared/ui/organisms/Modal";
import type { AdminFaq } from "@/entities/faq";

type FaqStatusModalProps = {
  faq?: AdminFaq;
  mode: "activate" | "deactivate";
  onClose: () => void;
  onConfirm: () => void;
};

const modalCopy = {
  activate: {
    confirmLabel: "활성화",
    description: "활성화하면 FAQ가 다시 노출됩니다.",
    title: "FAQ를 활성화할까요?",
  },
  deactivate: {
    confirmLabel: "비활성화",
    description:
      "비활성화하면 FAQ가 사용자 답변에 노출되지 않고 보관 상태로 전환됩니다. 필요하면 다시 활성화할 수 있습니다.",
    title: "FAQ를 비활성화할까요?",
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
            variant={mode === "deactivate" ? "secondary" : "primary"}
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

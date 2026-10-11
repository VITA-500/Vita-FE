"use client";

import { PortalDialog } from "@/shared/ui/PortalDialog";

type ChatDeleteConfirmDialogProps = {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ChatDeleteConfirmDialog = ({
  title,
  onCancel,
  onConfirm,
}: ChatDeleteConfirmDialogProps) => {
  return (
    <PortalDialog
      labelledBy="chat-delete-confirm-title"
      maxWidthClassName="max-w-[340px]"
      onClose={onCancel}
    >
      <h2
        id="chat-delete-confirm-title"
        className="text-base font-extrabold text-gray-950 dark:text-white"
      >
        상담을 삭제할까요?
      </h2>

      <p className="mt-2 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
        <span className="font-extrabold break-all text-gray-800 dark:text-gray-100">
          {title}
        </span>{" "}
        상담이 목록에서 삭제됩니다.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
        >
          취소
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="h-11 rounded-2xl bg-red-500 text-sm font-bold text-white transition hover:bg-red-600"
        >
          삭제
        </button>
      </div>
    </PortalDialog>
  );
};

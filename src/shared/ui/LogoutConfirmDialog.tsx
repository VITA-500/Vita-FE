"use client";

import { createPortal } from "react-dom";

type LogoutConfirmDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export const LogoutConfirmDialog = ({
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) => {
  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/35 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 text-center shadow-2xl dark:bg-zinc-950">
        <p
          id="logout-confirm-title"
          className="text-base font-extrabold text-gray-950 dark:text-white"
        >
          로그아웃 하시겠습니까?
        </p>

        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          다시 이용하려면 로그인이 필요해요.
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
            className="bg-brand hover:bg-brand-hover h-11 rounded-2xl text-sm font-bold text-white transition"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

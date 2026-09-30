"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { routes } from "@/shared/constants/routes";
import { PortalDialog } from "@/shared/ui/PortalDialog";

type GuestNewChatDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export const GuestNewChatDialog = ({
  onCancel,
  onConfirm,
}: GuestNewChatDialogProps) => {
  return (
    <PortalDialog
      labelledBy="guest-new-chat-title"
      className="relative"
      onClose={onCancel}
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="닫기"
      >
        <X size={19} />
      </button>

      <h2
        id="guest-new-chat-title"
        className="px-8 text-base font-extrabold text-gray-950 dark:text-white"
      >
        현재 채팅을 지울까요?
      </h2>

      <p className="mt-3 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
        새 채팅을 시작하면 현재 대화가 삭제됩니다.
        <br />
        채팅을 저장하려면{" "}
        <span className="font-extrabold text-gray-800 dark:text-gray-100">
          회원가입
        </span>
        하거나{" "}
        <span className="font-extrabold text-gray-800 dark:text-gray-100">
          로그인
        </span>
        하세요.
      </p>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={onConfirm}
          className="bg-brand hover:bg-brand-hover h-11 w-full rounded-2xl text-sm font-bold text-white transition"
        >
          채팅 지우기
        </button>

        <Link
          href={routes.login}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
        >
          로그인
        </Link>
      </div>
    </PortalDialog>
  );
};

"use client";

import { RotateCcw } from "lucide-react";
import { CHAT_TOUR_STORAGE_KEY } from "@/features/chat/constants";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { showToast } from "@/shared/ui/ToastProvider";

type ChatSettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
};

export const ChatSettingsPanel = ({
  isOpen,
  onClose,
  onStartTour,
}: ChatSettingsPanelProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="설정"
    description="채팅 화면에서 바로 적용되는 기본 설정입니다."
    actions={
      <Button variant="secondary" onClick={onClose}>
        닫기
      </Button>
    }
  >
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
        <div>
          <p className="font-extrabold">화면 테마</p>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            라이트/다크 모드를 전환합니다.
          </p>
        </div>
        <ThemeToggleButton />
      </div>

      <button
        type="button"
        onClick={() => {
          window.localStorage.removeItem(CHAT_TOUR_STORAGE_KEY);
          showToast("도움말을 다시 볼 수 있게 설정했어요.");
          onClose();
          window.setTimeout(() => onStartTour(), 120);
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 p-4 text-left transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/10"
      >
        <RotateCcw size={19} />
        <span>
          <span className="block font-extrabold">도움말 다시 보기</span>
          <span className="mt-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
            채팅 화면 안내 투어를 처음부터 실행합니다.
          </span>
        </span>
      </button>
    </div>
  </Modal>
);

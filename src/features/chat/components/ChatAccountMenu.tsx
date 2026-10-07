"use client";

import {
  ChevronRight,
  CircleHelp,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";
import { UserAvatar } from "@/shared/ui/UserAvatar";

type ChatAccountMenuProps = {
  displayName: string;
  onLogout: () => void;
  onOpenProfile: () => void;
  onStartTour: () => void;
};

const itemClassName =
  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white";

export const ChatAccountMenu = ({
  displayName,
  onLogout,
  onOpenProfile,
  onStartTour,
}: ChatAccountMenuProps) => (
  <div className="fixed bottom-[64px] left-2 z-[120] w-[280px] rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900">
    <button
      type="button"
      onClick={onOpenProfile}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-white/10"
    >
      <UserAvatar size="xs" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-gray-950 dark:text-white">
          {displayName}
        </span>
      </span>

      <ChevronRight size={17} className="text-gray-400 dark:text-gray-500" />
    </button>

    <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

    <button type="button" className={itemClassName}>
      <MessageCircle size={18} />
      개인 맞춤 설정
    </button>

    <button type="button" className={itemClassName}>
      <Settings size={18} />
      설정
    </button>

    <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

    <button type="button" onClick={onStartTour} className={itemClassName}>
      <CircleHelp size={18} />
      도움말
    </button>

    <button type="button" onClick={onLogout} className={itemClassName}>
      <LogOut size={18} />
      로그아웃
    </button>
  </div>
);

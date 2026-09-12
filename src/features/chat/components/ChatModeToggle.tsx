export const ChatModeToggle = () => (
  <div className="absolute inset-x-0 top-4 flex justify-center">
    <div className="grid h-11 w-[260px] grid-cols-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-bold text-gray-500 dark:border-white/10 dark:bg-white/10 dark:text-gray-400">
      <button
        type="button"
        className="rounded-full bg-white text-gray-950 shadow-sm dark:bg-zinc-950 dark:text-white"
      >
        상담
      </button>

      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-full opacity-60"
        aria-label="매장 모드는 준비 중입니다"
      >
        매장
      </button>
    </div>
  </div>
);

import { MapPin } from "lucide-react";

export const StorePanelHeader = () => (
  <header className="mb-5">
    <p className="bg-brand/10 text-brand mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-extrabold">
      <MapPin size={15} />
      가까운 매장 찾기
    </p>

    <h1 className="text-text-primary text-2xl font-extrabold tracking-normal sm:text-3xl dark:text-white">
      현재 위치 기준으로 가까운 매장을 안내해요
    </h1>

    <p className="text-text-secondary mt-3 max-w-2xl text-sm leading-6 dark:text-gray-400">
      가까운 매장과 연락처를 한 번에 확인하고, 방문 전 필요한 상담 내용을 이어서
      정리할 수 있어요.
    </p>
  </header>
);

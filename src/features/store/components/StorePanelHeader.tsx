import { MapPin } from "lucide-react";

export const StorePanelHeader = () => (
  <header className="mb-5">
    <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-2 text-xs font-extrabold text-brand">
      <MapPin size={15} />
      가까운 매장 찾기
    </p>

    <h1 className="text-2xl font-extrabold tracking-normal text-text-primary dark:text-white sm:text-3xl">
      현재 위치 기준으로 가까운 매장을 안내해요
    </h1>

    <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary dark:text-gray-400">
      가까운 매장과 연락처를 한 번에 확인하고, 방문 전 필요한 상담 내용을
      이어서 정리할 수 있어요.
    </p>
  </header>
);

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminShell } from "@/features/admin/components/AdminShell";

const meta = {
  title: "Admin/AdminShell",
  component: AdminShell,
  parameters: {
    layout: "fullscreen",
    // 사이드바의 활성 메뉴 표시(isMenuActive)는 usePathname()을 기준으로
    // 판단하므로, 실제 관리자 경로를 목(pathname)으로 지정해 "대시보드"
    // 메뉴가 활성 상태로 보이도록 했습니다.
    nextjs: {
      navigation: { pathname: "/admin" },
    },
  },
} satisfies Meta<typeof AdminShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Chat/ChatSidebar와 같은 폭 전환 애니메이션·색상·모바일 오버레이 동작을
 * 공유하도록 맞춘 사이드바예요. 두 스토리를 나란히 열어 접기/펼치기 동작을
 * 비교해 보세요.
 */
export const Default: Story = {
  args: {
    children: (
      <div>
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          관리자 콘텐츠 영역
        </h1>
        <p className="text-text-secondary mt-2 text-sm leading-6 font-medium">
          이 영역에 실제 관리자 페이지(대시보드, FAQ 관리, 매장 관리 등)가
          렌더링됩니다. 좌측 상단 버튼으로 사이드바를 접고 펼쳐보면서 챗봇
          사이드바와 동일한 전환 애니메이션인지 확인할 수 있어요.
        </p>
      </div>
    ),
  },
};

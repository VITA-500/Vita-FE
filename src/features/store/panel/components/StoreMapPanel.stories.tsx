import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/entities/user";
import { StoreMapPanel } from "@/features/store/panel/components/StoreMapPanel";

const storyQueryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const meta = {
  title: "Store/StoreMapPanel",
  component: StoreMapPanel,
  parameters: {
    layout: "fullscreen",
    // 예약 모달이 next/navigation의 useRouter를 쓴다(App Router 기준).
    nextjs: { appDirectory: true },
  },
  // 혜택 카테고리·제휴 매장·길찾기 조회가 TanStack Query를 쓰고, 예약 버튼이 로그인 상태를 읽는다.
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof StoreMapPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <StoreMapPanel />
    </div>
  ),
};

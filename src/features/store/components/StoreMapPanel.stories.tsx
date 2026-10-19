import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";

const storyQueryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const meta = {
  title: "Store/StoreMapPanel",
  component: StoreMapPanel,
  parameters: {
    layout: "fullscreen",
  },
  // 혜택 카테고리·제휴 매장·길찾기 조회가 TanStack Query를 쓴다.
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <Story />
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

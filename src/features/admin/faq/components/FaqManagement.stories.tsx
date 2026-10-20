import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActionStatusProvider } from "@/features/admin/common/context/ActionStatusContext";
import { AdminDataProvider } from "@/features/admin/common/context/AdminDataContext";
import { FaqManagement } from "@/features/admin/faq/components/FaqManagement";

const storyQueryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const meta = {
  title: "Admin/FaqManagement",
  component: FaqManagement,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true, navigation: { pathname: "/admin/faqs" } },
  },
  // 관리자 데이터(TanStack Query)·작업 상태·FAQ/매장 데이터 Provider를 실제 관리자 레이아웃처럼 감싼다.
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <ActionStatusProvider>
          <AdminDataProvider>
            <Story />
          </AdminDataProvider>
        </ActionStatusProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof FaqManagement>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

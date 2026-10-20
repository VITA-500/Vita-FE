import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActionStatusProvider } from "@/features/admin/common/context/ActionStatusContext";
import { AdminDashboard } from "@/features/admin/dashboard/components/AdminDashboard";

const storyQueryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

const meta = {
  title: "Admin/AdminDashboard",
  component: AdminDashboard,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true, navigation: { pathname: "/admin" } },
  },
  // 관리자 데이터(TanStack Query)·작업 상태를 실제 관리자 레이아웃처럼 감싼다.
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <ActionStatusProvider>
          <Story />
        </ActionStatusProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AdminDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";

const meta = {
  title: "Admin/AdminDashboard",
  component: AdminDashboard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof AdminDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

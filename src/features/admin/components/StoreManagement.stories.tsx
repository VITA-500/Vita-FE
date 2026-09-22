import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreManagement } from "@/features/admin/components/StoreManagement";

const meta = {
  title: "Admin/StoreManagement",
  component: StoreManagement,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof StoreManagement>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

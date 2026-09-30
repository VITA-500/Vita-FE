import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaqManagement } from "@/features/admin/components/FaqManagement";

const meta = {
  title: "Admin/FaqManagement",
  component: FaqManagement,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof FaqManagement>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

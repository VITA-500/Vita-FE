import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "@/shared/ui/Select";

const meta = {
  title: "Shared/Select",
  component: Select,
  parameters: {
    layout: "padded",
  },
  args: {
    className: "w-[220px] max-w-full",
    options: [
      { label: "기본", value: "기본" },
      { label: "상세", value: "상세" },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "기본",
  },
};

export const Placeholder: Story = {
  name: "값 없음 (placeholder)",
  args: {
    placeholder: "하위 카테고리 선택",
  },
};

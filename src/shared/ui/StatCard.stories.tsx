import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatCard } from "@/shared/ui/StatCard";

const meta = {
  title: "Shared/StatCard",
  component: StatCard,
  parameters: {
    layout: "padded",
  },
  args: {
    label: "총 FAQ",
    value: "142",
    helper: "지난 주 대비",
  },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[220px]">
      <StatCard {...args} />
    </div>
  ),
};

export const Grid: Story = {
  name: "Dashboard Grid",
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
      <StatCard label="총 FAQ" value="142" helper="지난 주 대비" />
      <StatCard label="오늘 수정된 FAQ" value="5" helper="오늘 등록" />
      <StatCard label="전체 매장 수" value="38" helper="게시중" />
    </div>
  ),
};

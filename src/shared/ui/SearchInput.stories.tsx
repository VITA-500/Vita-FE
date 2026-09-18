import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchInput } from "@/shared/ui/SearchInput";

const meta = {
  title: "Shared/SearchInput",
  component: SearchInput,
  args: {
    placeholder: "질문이나 키워드를 검색하세요",
    size: "md",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "w-[420px] max-w-full",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-[420px] max-w-full flex-col gap-4">
      <SearchInput size="sm" placeholder="sm" />
      <SearchInput size="md" placeholder="md (기본)" />
      <SearchInput size="lg" placeholder="lg" />
    </div>
  ),
};

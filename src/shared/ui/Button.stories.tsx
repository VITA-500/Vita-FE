import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: {
    children: "지금 시작하기",
    size: "md",
    variant: "primary",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outline",
        "ghost",
        "danger",
        "dangerGhost",
      ],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const WithIcon: Story = {
  args: {
    children: "지금 시작하기",
    rightIcon: <ArrowRight size={18} />,
  },
};

export const Loading: Story = {
  args: {
    children: "저장 중",
    isLoading: true,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button leftIcon={<Plus size={16} />}>등록</Button>
      <Button variant="secondary">수정</Button>
      <Button variant="outline">필터</Button>
      <Button variant="ghost">취소</Button>
      <Button variant="danger" leftIcon={<Trash2 size={16} />}>
        삭제
      </Button>
      <Button
        variant="dangerGhost"
        size="xs"
        className="h-8 w-8 rounded-lg p-0"
        aria-label="삭제"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">XS</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

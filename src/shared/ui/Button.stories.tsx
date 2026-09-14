import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight } from "lucide-react";
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
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        지금 시작하기
        <ArrowRight size={18} />
      </>
    ),
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "@/shared/ui/Logo";

const meta = {
  title: "Shared/Logo",
  component: Logo,
  args: {
    href: "/",
    heightClassName: "h-11",
    alt: "VITA 로고",
  },
  argTypes: {
    heightClassName: {
      control: "select",
      options: ["h-9", "h-11", "h-14"],
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    heightClassName: "h-9",
  },
};

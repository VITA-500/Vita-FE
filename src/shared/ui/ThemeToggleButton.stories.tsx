"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { ThemeProvider } from "@/shared/ui/ThemeProvider";

const ThemeTogglePreview = () => (
  <ThemeProvider>
    <div className="border-border rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <ThemeToggleButton />
    </div>
  </ThemeProvider>
);

const meta = {
  title: "Shared/ThemeToggleButton",
  component: ThemeToggleButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ThemeTogglePreview />,
};

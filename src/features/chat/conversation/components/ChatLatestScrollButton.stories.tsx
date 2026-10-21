import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatLatestScrollButton } from "@/features/chat/conversation/components/ChatLatestScrollButton";

const meta = {
  title: "Chat/ChatLatestScrollButton",
  component: ChatLatestScrollButton,
  parameters: { layout: "centered" },
  args: { isVisible: true, onClick: () => undefined },
} satisfies Meta<typeof ChatLatestScrollButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Answering: Story = {
  name: "답변 생성 중 · 비타민 방울 충전",
  args: { isLoading: true },
};

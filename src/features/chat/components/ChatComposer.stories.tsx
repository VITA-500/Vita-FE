import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatComposer } from "@/features/chat/components/ChatComposer";

const ChatComposerPreview = () => {
  const [value, setValue] = useState("");

  return (
    <div className="w-full max-w-[760px]">
      <ChatComposer
        value={value}
        onChange={setValue}
        onSubmit={() => setValue("")}
      />
    </div>
  );
};

const meta = {
  title: "Chat/ChatComposer",
  component: ChatComposer,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "",
    onChange: () => undefined,
    onSubmit: () => undefined,
  },
  render: () => <ChatComposerPreview />,
};

export const Loading: Story = {
  args: {
    isLoading: true,
    value: "요금제를 변경하고 싶어요",
    onChange: () => undefined,
    onSubmit: () => undefined,
  },
  render: () => (
    <div className="w-full max-w-[760px]">
      <ChatComposer
        isLoading
        value="요금제를 변경하고 싶어요"
        onChange={() => undefined}
        onSubmit={() => undefined}
      />
    </div>
  ),
};

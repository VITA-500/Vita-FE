import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreMapPanel } from "@/features/store/components/StoreMapPanel";

const meta = {
  title: "Store/StoreMapPanel",
  component: StoreMapPanel,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StoreMapPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <StoreMapPanel />
    </div>
  ),
};

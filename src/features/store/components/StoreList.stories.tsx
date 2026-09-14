import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { StoreList } from "@/features/store/components/StoreList";
import { mockStores } from "@/features/store/constants";

const StoreListPreview = () => {
  const [selectedStoreId, setSelectedStoreId] = useState(mockStores[0].id);

  return (
    <div className="h-[520px] w-[360px] max-w-full">
      <StoreList
        stores={mockStores}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />
    </div>
  );
};

const meta = {
  title: "Store/StoreList",
  component: StoreList,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof StoreList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stores: mockStores,
    selectedStoreId: mockStores[0].id,
    onSelectStore: () => undefined,
  },
  render: () => <StoreListPreview />,
};

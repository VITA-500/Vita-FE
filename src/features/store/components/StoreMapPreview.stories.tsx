import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMemo, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { mockStores } from "@/features/store/constants";

const StoreMapPreviewFrame = () => {
  const [selectedStoreId, setSelectedStoreId] = useState(mockStores[0].id);
  const selectedStore = useMemo(
    () => mockStores.find((store) => store.id === selectedStoreId),
    [selectedStoreId],
  );

  return (
    <div className="h-[520px] w-[760px] max-w-full">
      <StoreMapPreview
        stores={mockStores}
        selectedStore={selectedStore}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
      />
    </div>
  );
};

const meta = {
  title: "Store/StoreMapPreview",
  component: StoreMapPreview,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof StoreMapPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stores: mockStores,
    selectedStore: mockStores[0],
    selectedStoreId: mockStores[0].id,
    onSelectStore: () => undefined,
  },
  render: () => <StoreMapPreviewFrame />,
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMemo, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import type { StoreLocation } from "@/features/store/types";

const storyStores: StoreLocation[] = [
  {
    id: "story-gangnam-001",
    name: "VITA 강남역점",
    address: "서울 강남구 강남대로 396",
    phone: "02-0000-0001",
    lat: 37.498095,
    lng: 127.02761,
    distanceText: "약 320m",
  },
  {
    id: "story-seocho-001",
    name: "VITA 서초점",
    address: "서울 서초구 서초대로 74길 45",
    phone: "02-0000-0002",
    lat: 37.494667,
    lng: 127.028002,
    distanceText: "약 640m",
  },
];

const StoreMapPreviewFrame = () => {
  const [selectedStoreId, setSelectedStoreId] = useState(storyStores[0].id);
  const selectedStore = useMemo(
    () => storyStores.find((store) => store.id === selectedStoreId),
    [selectedStoreId],
  );

  return (
    <div className="h-[520px] w-[760px] max-w-full">
      <StoreMapPreview
        stores={storyStores}
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
    stores: storyStores,
    selectedStore: storyStores[0],
    selectedStoreId: storyStores[0].id,
    onSelectStore: () => undefined,
  },
  render: () => <StoreMapPreviewFrame />,
};

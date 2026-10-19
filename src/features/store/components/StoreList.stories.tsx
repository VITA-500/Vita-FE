import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { StoreList } from "@/features/store/components/StoreList";
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

const StoreListPreview = () => {
  const [selectedStoreId, setSelectedStoreId] = useState(storyStores[0].id);

  return (
    <div className="h-[520px] w-[360px] max-w-full">
      <StoreList
        stores={storyStores}
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
    stores: storyStores,
    selectedStoreId: storyStores[0].id,
    onSelectStore: () => undefined,
  },
  render: () => <StoreListPreview />,
};

export const LocationDenied: Story = {
  args: {
    stores: storyStores,
    selectedStoreId: storyStores[0].id,
    locationStatus: "denied",
    onSelectStore: () => undefined,
  },
};

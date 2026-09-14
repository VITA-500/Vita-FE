"use client";

import { useMemo, useState } from "react";
import { StoreList } from "@/features/store/components/StoreList";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { StorePanelHeader } from "@/features/store/components/StorePanelHeader";
import { storeService } from "@/features/store/lib/storeService";

export const StoreMapPanel = () => {
  const stores = storeService.getNearbyStores();
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? stores[0],
    [selectedStoreId, stores],
  );

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-5 pb-10 pt-16 sm:px-8 md:pt-12">
      <StorePanelHeader />

      <div className="grid min-h-[520px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <StoreMapPreview
          selectedStore={selectedStore}
          selectedStoreId={selectedStoreId}
          stores={stores}
          onSelectStore={setSelectedStoreId}
        />

        <StoreList
          selectedStoreId={selectedStoreId}
          stores={stores}
          onSelectStore={setSelectedStoreId}
        />
      </div>
    </div>
  );
};

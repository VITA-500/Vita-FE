"use client";

import { useState } from "react";
import { StoreManagement } from "./StoreManagement";
import { BenefitManagement } from "./BenefitManagement";
import { useAdminData } from "../context/AdminDataContext";
import { cn } from "@/shared/lib/cn";

const views = [
  { id: "stores", label: "제휴점" },
  { id: "benefits", label: "제휴 서비스" },
] as const;
type PartnerView = (typeof views)[number]["id"];

export const PartnerManagement = ({
  initialView = "stores",
}: {
  initialView?: PartnerView;
}) => {
  const [view, setView] = useState<PartnerView>(initialView);
  const { setStoreCategory } = useAdminData();
  const selectCategory = (category: string) => {
    setStoreCategory(category);
    setView("stores");
  };
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white">
        제휴 관리
      </h1>
      <p className="text-text-secondary mt-2 text-sm">
        제휴점과 제휴 서비스를 한곳에서 관리합니다.
      </p>
      <div
        role="tablist"
        aria-label="제휴 관리"
        className="my-6 flex gap-1 border-b border-gray-200 dark:border-white/10"
      >
        {views.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`partner-tab-${item.id}`}
            aria-controls={`partner-panel-${item.id}`}
            aria-selected={view === item.id}
            tabIndex={view === item.id ? 0 : -1}
            onClick={() => setView(item.id)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 1
                    : event.key === "ArrowRight"
                      ? (index + 1) % 2
                      : event.key === "ArrowLeft"
                        ? (index + 1) % 2
                        : null;
              if (next === null) return;
              event.preventDefault();
              setView(views[next].id);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [next]?.focus();
            }}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-bold transition",
              view === item.id
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="partner-panel-stores"
        aria-labelledby="partner-tab-stores"
        hidden={view !== "stores"}
      >
        <StoreManagement storeType="PARTNER" embedded />
      </div>
      <div
        role="tabpanel"
        id="partner-panel-benefits"
        aria-labelledby="partner-tab-benefits"
        hidden={view !== "benefits"}
      >
        <BenefitManagement embedded onSelectCategory={selectCategory} />
      </div>
    </div>
  );
};

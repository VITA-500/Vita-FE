"use client";

import { useState } from "react";
import { StoreManagement } from "@/features/admin/stores/components/StoreManagement";
import { BenefitManagement } from "@/features/admin/benefits/components/BenefitManagement";
import { useAdminData } from "@/features/admin/common/context/AdminDataContext";
import { AdminPageHeader } from "@/features/admin/common/components/AdminPageHeader";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/Button";
import { Plus } from "lucide-react";

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
  const [isStoreCreateOpen, setIsStoreCreateOpen] = useState(false);
  const [isBenefitCreateOpen, setIsBenefitCreateOpen] = useState(false);
  const { setStoreBenefitId } = useAdminData();
  const selectBenefit = (benefitId: number) => {
    setStoreBenefitId(benefitId);
    setView("stores");
  };
  return (
    <div>
      <AdminPageHeader
        title="제휴 관리"
        description="제휴점과 제휴 서비스를 한곳에서 관리합니다."
        action={
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() =>
              view === "stores"
                ? setIsStoreCreateOpen(true)
                : setIsBenefitCreateOpen(true)
            }
          >
            {view === "stores" ? "제휴점 추가" : "제휴 혜택 등록"}
          </Button>
        }
      />
      <div
        role="tabpanel"
        id="partner-panel-stores"
        aria-labelledby="partner-tab-stores"
        hidden={view !== "stores"}
      >
        <StoreManagement
          storeType="PARTNER"
          embedded
          toolbarLeading={
            view === "stores" ? (
              <PartnerTabs view={view} onChange={setView} />
            ) : null
          }
          createModalOpen={isStoreCreateOpen}
          onCreateModalOpenChange={setIsStoreCreateOpen}
        />
      </div>
      <div
        role="tabpanel"
        id="partner-panel-benefits"
        aria-labelledby="partner-tab-benefits"
        hidden={view !== "benefits"}
      >
        <BenefitManagement
          embedded
          onSelectBenefit={selectBenefit}
          toolbarLeading={
            view === "benefits" ? (
              <PartnerTabs view={view} onChange={setView} />
            ) : null
          }
          createModalOpen={isBenefitCreateOpen}
          onCreateModalOpenChange={setIsBenefitCreateOpen}
        />
      </div>
    </div>
  );
};

const PartnerTabs = ({
  onChange,
  view,
}: {
  onChange: (view: PartnerView) => void;
  view: PartnerView;
}) => (
  <div
    role="tablist"
    aria-label="제휴 관리"
    className="flex gap-1 border-b border-gray-200 dark:border-white/10"
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
        onClick={() => onChange(item.id)}
        onKeyDown={(event) => {
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 1
                : event.key === "ArrowRight" || event.key === "ArrowLeft"
                  ? (index + (event.key === "ArrowRight" ? 1 : -1) + 2) % 2
                  : null;
          if (next === null) return;
          event.preventDefault();
          onChange(views[next].id);
          window.requestAnimationFrame(() => {
            document.getElementById(`partner-tab-${views[next].id}`)?.focus();
          });
        }}
        className={cn(
          "border-b-2 px-4 py-2.5 text-sm font-semibold transition",
          view === item.id
            ? "border-brand text-brand"
            : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200",
        )}
      >
        {item.label}
      </button>
    ))}
  </div>
);

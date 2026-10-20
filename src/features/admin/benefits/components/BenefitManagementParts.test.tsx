import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BenefitStoreCount } from "@/features/admin/benefits/components/BenefitManagementParts";
import type { AdminBenefitDetail } from "@/entities/benefit";

describe("benefit store count navigation", () => {
  it("opens stores connected to the benefit from its count", () => {
    const onSelectBenefit = vi.fn();
    render(
      <BenefitStoreCount
        benefit={
          {
            benefitId: 17,
            brand: "VITA 제휴",
            name: "주말 할인",
            category: "여가",
            storeCount: 3,
          } as AdminBenefitDetail
        }
        onSelectBenefit={onSelectBenefit}
      />,
    );
    const button = screen.getByRole("button", {
      name: "VITA 제휴 주말 할인 연결 매장 보기",
    });
    expect(button).toHaveTextContent("3곳");
    expect(button).not.toHaveClass("border", "underline");
    fireEvent.click(button);
    expect(onSelectBenefit).toHaveBeenCalledWith(17);
  });
});

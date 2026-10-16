import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartnerManagement } from "./PartnerManagement";

const { setStoreBenefitId } = vi.hoisted(() => ({
  setStoreBenefitId: vi.fn(),
}));
vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({ setStoreBenefitId }),
}));
vi.mock("./StoreManagement", () => ({
  StoreManagement: () => <p>제휴점 목록</p>,
}));
vi.mock("./BenefitManagement", () => ({
  BenefitManagement: ({
    onSelectBenefit,
  }: {
    onSelectBenefit: (benefitId: number) => void;
  }) => (
    <button onClick={() => onSelectBenefit(17)}>
      선택 혜택 연결 매장 보기
    </button>
  ),
}));

describe("PartnerManagement", () => {
  it("switches views and opens stores filtered by the selected benefit", () => {
    render(<PartnerManagement />);
    expect(screen.getByRole("tab", { name: "제휴점" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: "제휴 서비스" }));
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "partner-panel-benefits",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "선택 혜택 연결 매장 보기" }),
    );
    expect(setStoreBenefitId).toHaveBeenCalledWith(17);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("제휴점 목록");
  });
  it("opens the services view for the legacy benefits URL and supports keyboard navigation", () => {
    render(<PartnerManagement initialView="benefits" />);
    const services = screen.getByRole("tab", { name: "제휴 서비스" });
    expect(services).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(services, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "제휴점" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("제휴점 목록");
  });
});

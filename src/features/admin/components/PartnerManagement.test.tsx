import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartnerManagement } from "./PartnerManagement";

const { setStoreCategory } = vi.hoisted(() => ({
  setStoreCategory: vi.fn(),
}));
vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({ setStoreCategory }),
}));
vi.mock("./StoreManagement", () => ({
  StoreManagement: () => <p>제휴점 목록</p>,
}));
vi.mock("./BenefitManagement", () => ({
  BenefitManagement: ({
    onSelectCategory,
  }: {
    onSelectCategory: (category: string) => void;
  }) => (
    <button onClick={() => onSelectCategory("자동차")}>
      자동차 제휴점 보기
    </button>
  ),
}));

describe("PartnerManagement", () => {
  it("switches between stores and services and opens stores filtered by the selected category", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "자동차 제휴점 보기" }));
    expect(setStoreCategory).toHaveBeenCalledWith("자동차");
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

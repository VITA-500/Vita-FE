import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BenefitStoreCount } from "./BenefitManagementParts";
import type { AdminBenefitDetail } from "../types";

describe("benefit store count navigation", () => {
  it("opens the category from the count with a keyboard accessible button", () => {
    const onSelectCategory = vi.fn();
    render(
      <BenefitStoreCount
        benefit={{ category: "여가", storeCount: 3 } as AdminBenefitDetail}
        onSelectCategory={onSelectCategory}
      />,
    );
    const button = screen.getByRole("button", { name: "여가 제휴점 모아보기" });
    expect(button).toHaveTextContent("3곳");
    expect(button).not.toHaveClass("border", "underline");
    fireEvent.click(button);
    expect(onSelectCategory).toHaveBeenCalledWith("여가");
  });
});

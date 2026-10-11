import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminResultSummary } from "@/features/admin/components/AdminResultSummary";

describe("AdminResultSummary", () => {
  it("renders the visible item range and total count", () => {
    render(
      <AdminResultSummary rangeStart={21} rangeEnd={40} totalCount={128} />,
    );

    expect(screen.getByText("21-40 / 총 128개")).toBeInTheDocument();
  });

  it("renders a trimmed search keyword when provided", () => {
    render(
      <AdminResultSummary
        keyword="  로밍  "
        rangeStart={1}
        rangeEnd={3}
        totalCount={3}
      />,
    );

    expect(
      screen.getByText('"로밍" 검색 결과', { exact: false }),
    ).toBeInTheDocument();
  });
});

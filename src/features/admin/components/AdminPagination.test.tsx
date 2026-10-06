import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminPagination } from "./AdminPagination";

describe("AdminPagination", () => {
  it("renders active page and disables previous button on first page", () => {
    render(
      <AdminPagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "1페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeEnabled();
  });

  it("calls onPageChange when moving pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <AdminPagination
        currentPage={3}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "이전 페이지" }));
    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    await user.click(screen.getByRole("button", { name: "4페이지" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
  });

  it("shows ellipsis and submits direct page jumps", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <AdminPagination
        currentPage={5}
        totalPages={20}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getAllByText("...")).toHaveLength(2);

    await user.type(screen.getByPlaceholderText("페이지"), "12{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(12);
  });

  it("does not allow interactions while disabled", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <AdminPagination
        currentPage={5}
        disabled
        totalPages={20}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "4페이지" }));
    await user.click(screen.getByRole("button", { name: "이동" }));

    expect(screen.getByPlaceholderText("페이지")).toBeDisabled();
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

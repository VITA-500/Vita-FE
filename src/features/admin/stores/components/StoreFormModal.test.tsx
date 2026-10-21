import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreFormModal } from "@/features/admin/stores/components/StoreFormModal";
import { storeDetails } from "@/features/admin/common/lib/adminData";

describe("store business hours request", () => {
  it("sends the existing formatted hours when the form is submitted", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <StoreFormModal
        isOpen
        mode="edit"
        store={storeDetails[0]}
        storeType="PHONE"
        storeLabel="대리점"
        benefits={[]}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    fireEvent.submit(document.getElementById("store-edit-form")!);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ businessHours: "09:00-21:00" }),
      ),
    );
  });

  it("blocks a closing time earlier than the opening time", async () => {
    const onSave = vi.fn();
    render(
      <StoreFormModal
        isOpen
        mode="edit"
        store={storeDetails[0]}
        storeType="PHONE"
        storeLabel="대리점"
        benefits={[]}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "21:00" }));
    fireEvent.click(screen.getByRole("button", { name: "08시" }));
    fireEvent.click(screen.getByRole("button", { name: "00분" }));
    fireEvent.submit(document.getElementById("store-edit-form")!);
    await waitFor(() =>
      expect(
        screen.getByText("종료 시간은 시작 시간보다 늦게 입력해 주세요."),
      ).toBeInTheDocument(),
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});

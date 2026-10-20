import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreFormModal } from "@/features/admin/stores/components/StoreFormModal";
import { storeDetails } from "@/features/admin/common/lib/adminData";

describe("store business hours request", () => {
  it.each([
    { input: "", expected: null },
    { input: " 22:00-02:00 ", expected: "22:00-02:00" },
  ])(
    "sends $expected when editing hours to '$input'",
    async ({ input, expected }) => {
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
      const hours = screen.getByRole("textbox", { name: "운영시간" });
      fireEvent.change(hours, { target: { value: input } });
      fireEvent.submit(hours.closest("form")!);
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ businessHours: expected }),
        ),
      );
    },
  );

  it("blocks the old tilde format before sending a request", async () => {
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
    const hours = screen.getByRole("textbox", { name: "운영시간" });
    fireEvent.change(hours, { target: { value: "09:00~18:00" } });
    fireEvent.submit(hours.closest("form")!);
    await waitFor(() =>
      expect(
        screen.getByText("운영시간은 09:00-18:00 형식으로 입력해 주세요."),
      ).toBeInTheDocument(),
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});

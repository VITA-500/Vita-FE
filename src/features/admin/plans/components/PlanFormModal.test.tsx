import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanFormModal } from "./PlanFormModal";
import { previewPlans } from "@/features/admin/common/lib/adminPreviewData";

describe("PlanFormModal", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });
  it("accepts a valid age range without imposing target-specific policy", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <PlanFormModal
        isOpen
        mode="edit"
        initialValues={{ ...previewPlans[1], minAge: 18, maxAge: 39 }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    fireEvent.submit(document.getElementById("plan-form")!);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          targetGroup: "YOUTH",
          minAge: 18,
          maxAge: 39,
        }),
      ),
    );
  });
  it("rejects an age outside the BE 0–150 range", async () => {
    const onSave = vi.fn();
    render(
      <PlanFormModal
        isOpen
        mode="edit"
        initialValues={{ ...previewPlans[1], minAge: 18, maxAge: 151 }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    fireEvent.submit(document.getElementById("plan-form")!);
    expect(
      await screen.findByText("가입 연령은 0~150세의 정수로 입력해 주세요."),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation feedback and scrolls to it when required fields are missing", async () => {
    const onSave = vi.fn();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <PlanFormModal isOpen mode="create" onClose={vi.fn()} onSave={onSave} />,
    );

    fireEvent.submit(document.getElementById("plan-form")!);

    expect(
      await screen.findByText("필수 항목을 모두 입력해 주세요."),
    ).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps the modal open while saving", async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const onClose = vi.fn();

    render(
      <PlanFormModal isOpen mode="create" onClose={onClose} onSave={onSave} />,
    );

    const fields = [
      ["예: BASIC_5G_001", "BASIC_5G_001"],
      ["예: 5G 베이직 요금제", "5G 베이직"],
      ["예: 부담 없이 시작하는 5G 요금제", "기본 요금제"],
      ["예: 55000", "55000"],
      [
        "예: 월 10GB 데이터와 기본 음성·문자를 제공하는 5G 요금제입니다.",
        "기본 데이터를 제공하는 요금제입니다.",
      ],
    ] as const;

    for (const [placeholder, value] of fields) {
      fireEvent.change(screen.getByPlaceholderText(placeholder), {
        target: { value },
      });
    }

    fireEvent.submit(document.getElementById("plan-form")!);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).not.toHaveBeenCalled();

    resolveSave?.();
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });
});

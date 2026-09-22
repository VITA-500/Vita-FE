import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminDataProvider, useAdminData } from "./AdminDataContext";

const FaqProbe = () => {
  const { addFaq, faqs, saveFaq } = useAdminData();
  const latestFaq = faqs[0];

  return (
    <div>
      <span data-testid="latest-answer">{latestFaq.answer}</span>
      <button
        type="button"
        onClick={() =>
          addFaq({
            answer: "신규 FAQ 답변",
            category: "기타",
            question: "신규 FAQ 질문",
          })
        }
      >
        FAQ 추가
      </button>
      <button
        type="button"
        onClick={() =>
          saveFaq(latestFaq.faqId, {
            ...latestFaq,
            answer: "수정된 FAQ 답변",
          })
        }
      >
        FAQ 수정
      </button>
    </div>
  );
};

describe("AdminDataProvider", () => {
  it("keeps FAQ answers when creating and editing FAQ rows", async () => {
    const user = userEvent.setup();

    render(
      <AdminDataProvider>
        <FaqProbe />
      </AdminDataProvider>,
    );

    await user.click(screen.getByRole("button", { name: "FAQ 추가" }));

    expect(screen.getByTestId("latest-answer")).toHaveTextContent(
      "신규 FAQ 답변",
    );

    await user.click(screen.getByRole("button", { name: "FAQ 수정" }));

    expect(screen.getByTestId("latest-answer")).toHaveTextContent(
      "수정된 FAQ 답변",
    );
  });
});

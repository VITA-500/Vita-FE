import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AdminDataProvider, useAdminData } from "./AdminDataContext";

const renderWithQueryClient = (children: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
};

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
            category: "서비스안내",
            question: "신규 FAQ 질문",
            subcategory: "정보변경",
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

    renderWithQueryClient(
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import { feedbackApi } from "./feedbackApi";

vi.mock("@/shared/api/http", async (original) => ({
  ...(await original<object>()),
  requestJson: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());

describe("answer feedback endpoint contract", () => {
  it("posts like, dislike and cancel to the message feedback endpoint", async () => {
    vi.mocked(requestJson).mockResolvedValue({});

    for (const feedback of ["LIKE", "DISLIKE", null] as const) {
      await feedbackApi.sendAnswerFeedback(25, feedback);
      expect(requestJson).toHaveBeenLastCalledWith(
        "/chat/messages/25/feedback",
        { method: "POST", body: JSON.stringify({ feedback }) },
      );
    }
  });
});

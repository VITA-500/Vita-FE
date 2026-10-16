import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import { chatService } from "./chatService";

vi.mock("@/shared/api/http", async (original) => ({
  ...(await original<object>()),
  requestJson: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
describe("session and feedback endpoint contracts", () => {
  it("uses BE list, detail, pin, delete and feedback endpoints", async () => {
    vi.mocked(requestJson).mockResolvedValue({});
    await chatService.getSessions();
    expect(requestJson).toHaveBeenLastCalledWith("/chat/sessions");
    await chatService.getMessages(12);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12/messages",
      {},
    );
    await chatService.updateSessionPin(12, true);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12/pin",
      expect.objectContaining({ method: "PATCH", body: '{"pinned":true}' }),
    );
    await chatService.deleteSession(12);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12",
      expect.objectContaining({ method: "DELETE" }),
    );
    for (const feedback of ["LIKE", "DISLIKE", null] as const) {
      await chatService.sendFeedback(25, feedback);
      expect(requestJson).toHaveBeenLastCalledWith(
        "/chat/messages/25/feedback",
        { method: "POST", body: JSON.stringify({ feedback }) },
      );
    }
  });
});

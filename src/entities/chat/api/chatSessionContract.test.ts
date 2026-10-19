import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import { chatApi } from "./chatApi";

vi.mock("@/shared/api/http", async (original) => ({
  ...(await original<object>()),
  requestJson: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
describe("session endpoint contracts", () => {
  it("uses BE list, detail, pin and delete endpoints", async () => {
    vi.mocked(requestJson).mockResolvedValue({});
    await chatApi.getSessions();
    expect(requestJson).toHaveBeenLastCalledWith("/chat/sessions");
    await chatApi.getMessages(12);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12/messages",
      {},
    );
    await chatApi.updateSessionPin(12, true);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12/pin",
      expect.objectContaining({ method: "PATCH", body: '{"pinned":true}' }),
    );
    await chatApi.updateSessionTitle(12, "새 상담 이름");
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12/title",
      expect.objectContaining({
        method: "PATCH",
        body: '{"title":"새 상담 이름"}',
      }),
    );
    await chatApi.deleteSession(12);
    expect(requestJson).toHaveBeenLastCalledWith(
      "/chat/sessions/12",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import type { AdminPlanRequest } from "../model/types";
import { adminPlanApi } from "./admin";

vi.mock("@/shared/api/http", () => ({ requestJson: vi.fn() }));

const input: AdminPlanRequest = {
  planCode: "VITA-5G-001",
  name: "5G 기본",
  summary: "요금제 요약",
  price: 39000,
  networkType: "5G",
  targetGroup: "GENERAL",
  minAge: null,
  maxAge: null,
  dataPolicy: "LIMITED",
  baseDataMb: 6144,
  exhaustedSpeedKbps: null,
  voicePolicy: "UNLIMITED",
  voiceMinutes: null,
  smsPolicy: "UNLIMITED",
  smsCount: null,
  description: "요금제 설명",
};

describe("adminPlanApi", () => {
  beforeEach(() => {
    vi.mocked(requestJson).mockReset().mockResolvedValue({});
  });

  it("passes server pagination, search, and sort parameters", async () => {
    await adminPlanApi.fetchPlans({
      page: 2,
      size: 50,
      keyword: "  5G ",
      sortBy: "price,asc",
    });

    const [url] = vi.mocked(requestJson).mock.calls[0];
    expect(String(url)).toContain(
      "/admin/plans?page=2&size=50&keyword=5G&sortBy=price%2Casc",
    );
  });

  it("uses the BE CRUD paths and request bodies", async () => {
    await adminPlanApi.createPlan(input);
    await adminPlanApi.updatePlan(7, { price: 42000 });
    await adminPlanApi.deactivatePlan(7);

    expect(vi.mocked(requestJson).mock.calls).toEqual([
      [
        "/admin/plans",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(input),
        }),
      ],
      [
        "/admin/plans/7",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ price: 42000 }),
        }),
      ],
      ["/admin/plans/7", expect.objectContaining({ method: "DELETE" })],
    ]);
  });
});

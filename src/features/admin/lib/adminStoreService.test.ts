import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/shared/api/http";
import { adminStoreService } from "./adminStoreService";
vi.mock("@/shared/api/http", () => ({ requestJson: vi.fn() }));
beforeEach(() => {
  vi.mocked(requestJson).mockReset().mockResolvedValue({
    content: [],
    currentPage: 0,
    totalCount: 0,
    totalPages: 0,
  });
});
describe("admin store category filter contract", () => {
  it.each(["여가", "쇼핑", "자동차"])(
    "filters %s with the BE category parameter and preserves search and pagination",
    async (category) => {
      await adminStoreService.fetchStores({
        storeType: "PARTNER",
        category,
        page: 2,
        size: 20,
        sortBy: "createdAt,desc",
        keyword: "강남",
      });
      const url = new URL(
        String(vi.mocked(requestJson).mock.calls[0][0]),
        "https://api.test",
      );
      expect(url.pathname).toBe("/admin/stores");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        storeType: "PARTNER",
        category,
        page: "2",
        size: "20",
        sortBy: "createdAt,desc",
        keyword: "강남",
      });
    },
  );
  it("omits category for all-categories and phone store requests", async () => {
    await adminStoreService.fetchStores({
      storeType: "PARTNER",
      page: 0,
      size: 20,
      sortBy: "createdAt,desc",
    });
    await adminStoreService.fetchStores({
      storeType: "PHONE",
      category: "자동차",
      page: 0,
      size: 20,
      sortBy: "createdAt,desc",
    });
    for (const [url] of vi.mocked(requestJson).mock.calls)
      expect(String(url)).not.toContain("category");
  });
  it("filters partner stores by the exact connected benefit", async () => {
    await adminStoreService.fetchStores({
      storeType: "PARTNER",
      benefitId: 17,
      page: 0,
      size: 20,
      sortBy: "createdAt,desc",
    });

    const url = new URL(
      String(vi.mocked(requestJson).mock.calls[0][0]),
      "https://api.test",
    );
    expect(url.searchParams.get("benefitId")).toBe("17");
    expect(url.searchParams.has("category")).toBe(false);
  });
});

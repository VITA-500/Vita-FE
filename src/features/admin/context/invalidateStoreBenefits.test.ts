import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { adminQueryKeys } from "./adminQueryKeys";
import { invalidateStoreBenefits } from "./invalidateStoreBenefits";

describe("store and benefit cache invalidation", () => {
  it("invalidates every filtered page in both domains while retaining unrelated data", async () => {
    const client = new QueryClient();
    const storeKey = adminQueryKeys.stores({
      keyword: "서울",
      page: 2,
      pageSize: 20,
      sortDirection: "desc",
      sortField: "createdAt",
      storeType: "PARTNER",
      benefitId: 17,
    });
    const benefitKey = adminQueryKeys.benefits({
      category: "ALL",
      keyword: "혜택",
      page: 1,
      pageSize: 20,
      sortBy: "createdAt,desc",
    });
    const otherStoreKey = [...adminQueryKeys.storesAll, { page: 0 }];
    const faqKey = [...adminQueryKeys.faqsAll, { page: 0 }];
    try {
      for (const key of [storeKey, otherStoreKey, benefitKey, faqKey]) {
        client.setQueryData(key, { retained: true });
      }

      await invalidateStoreBenefits(client);

      for (const key of [storeKey, otherStoreKey, benefitKey]) {
        expect(client.getQueryState(key)?.isInvalidated).toBe(true);
        expect(client.getQueryData(key)).toEqual({ retained: true });
      }
      expect(client.getQueryState(faqKey)?.isInvalidated).toBe(false);
    } finally {
      client.clear();
    }
  });
});

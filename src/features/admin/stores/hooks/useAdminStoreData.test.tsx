import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import { useAdminStoreData } from "@/features/admin/stores/hooks/useAdminStoreData";
import { storeDetails } from "@/features/admin/common/lib/adminData";
import { adminQueryKeys } from "@/features/admin/common/context/adminQueryKeys";

vi.mock("@/shared/config/env", () => ({
  env: { apiBaseUrl: "https://api.vita.test" },
}));
vi.mock("@/features/admin/lib/adminStoreService", () => ({
  adminStoreService: { fetchStores: vi.fn(), updateStore: vi.fn() },
}));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.clearAllMocks();
});
const setup = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  clients.push(client);
  vi.mocked(adminStoreService.fetchStores).mockImplementation(
    async ({ page }) => ({
      stores: [],
      details: [],
      totalPages: 5,
      totalCount: 100,
      currentPage: page,
    }),
  );
  return {
    client,
    ...renderHook(() => useAdminStoreData("PARTNER"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
  };
};
describe("partner store filters", () => {
  it("changes the server filter and cache key, resets pagination and clears the category for phone stores", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isStoreLoading).toBe(false));
    act(() => result.current.setStorePage(3));
    await waitFor(() =>
      expect(adminStoreService.fetchStores).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 3 }),
      ),
    );
    act(() => result.current.setStoreCategory("자동차"));
    await waitFor(() =>
      expect(adminStoreService.fetchStores).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 0,
          storeType: "PARTNER",
          category: "자동차",
        }),
      ),
    );
    expect(result.current.storeCategory).toBe("자동차");
    act(() => result.current.setStoreTypeFilter("PHONE"));
    await waitFor(() =>
      expect(adminStoreService.fetchStores).toHaveBeenLastCalledWith(
        expect.objectContaining({ storeType: "PHONE", category: undefined }),
      ),
    );
    expect(result.current.storeCategory).toBeUndefined();
  });
  it("refreshes benefit options and connected store counts after changing a store", async () => {
    const { result, client } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(result.current.isStoreLoading).toBe(false));
    vi.mocked(adminStoreService.updateStore).mockResolvedValue({
      storeId: 1,
      updatedAt: "now",
    });
    await act(async () => {
      await result.current.saveStore(1, storeDetails[0]);
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: adminQueryKeys.benefitsAll,
    });
  });
  it("filters by one benefit and clears it when a category is selected", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isStoreLoading).toBe(false));

    act(() => result.current.setStoreBenefitId(17));
    await waitFor(() =>
      expect(adminStoreService.fetchStores).toHaveBeenLastCalledWith(
        expect.objectContaining({ benefitId: 17, category: undefined }),
      ),
    );

    act(() => result.current.setStoreCategory("여가"));
    await waitFor(() =>
      expect(adminStoreService.fetchStores).toHaveBeenLastCalledWith(
        expect.objectContaining({ benefitId: undefined, category: "여가" }),
      ),
    );
  });
});

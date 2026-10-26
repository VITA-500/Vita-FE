import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { adminPlanApi } from "@/entities/plan";
import { previewPlans } from "@/features/admin/common/lib/adminPreviewData";
import { useAdminPlans } from "./useAdminPlans";

vi.mock("@/shared/config/env", () => ({
  env: { apiBaseUrl: "https://api.vita.test" },
}));
vi.mock("@/entities/plan", async (original) => ({
  ...(await original<typeof import("@/entities/plan")>()),
  adminPlanApi: { fetchPlans: vi.fn() },
}));

it("includes target matches on later server pages", async () => {
  vi.mocked(adminPlanApi.fetchPlans).mockImplementation(async ({ page }) => ({
    content: [previewPlans[page === 0 ? 0 : 1]],
    currentPage: page,
    totalCount: 2,
    totalPages: 2,
  }));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useAdminPlans(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.setTargetGroup("YOUTH"));
  await waitFor(() =>
    expect(result.current.plans[0]?.targetGroup).toBe("YOUTH"),
  );
  expect(adminPlanApi.fetchPlans).toHaveBeenCalledWith(
    expect.objectContaining({ page: 1, size: 100 }),
  );
  expect(result.current.totalCount).toBe(1);
  client.clear();
});

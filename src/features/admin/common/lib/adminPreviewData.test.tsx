import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { useAdminPlans } from "@/features/admin/plans/hooks/useAdminPlans";
import { useAdminBenefits } from "@/features/admin/benefits/hooks/useAdminBenefits";
import { useAdminUsers } from "@/features/admin/users/hooks/useAdminUsers";
import { useAdminUserSummary } from "@/features/admin/users/hooks/useAdminUserSummary";
import { useAdminStoreData } from "@/features/admin/stores/hooks/useAdminStoreData";

vi.mock("@/shared/config/env", () => ({ env: { apiBaseUrl: "" } }));

it("supports offline plan and benefit edits and member summary updates without requests", async () => {
  const fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("Unexpected API request"));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(
    () => ({
      plans: useAdminPlans(),
      benefits: useAdminBenefits(),
      users: useAdminUsers(),
      summary: useAdminUserSummary(),
      stores: useAdminStoreData("PARTNER"),
    }),
    { wrapper },
  );
  expect(result.current.plans.totalCount).toBeGreaterThan(0);
  expect(result.current.benefits.totalCount).toBeGreaterThan(0);
  const id = result.current.plans.plans[0].planId;
  await act(async () => {
    await result.current.plans.deactivatePlan(id);
  });
  await waitFor(() =>
    expect(
      result.current.plans.plans.find((row) => row.planId === id)?.status,
    ).toBe("INACTIVE"),
  );
  const benefit = result.current.benefits.benefits[0];
  const originalStore = result.current.stores.storeDetails.find(
    (row) => row.storeId === 101,
  )!;
  const {
    storeId,
    storeType,
    createdAt,
    updatedAt,
    brand,
    category,
    benefitName,
    ...input
  } = originalStore;
  void storeType;
  void createdAt;
  void updatedAt;
  void brand;
  void category;
  void benefitName;
  await act(async () => {
    await result.current.stores.saveStore(storeId, {
      ...input,
      name: "변경된 제휴점",
    });
  });
  await waitFor(() => {
    expect(
      result.current.stores.stores.find((row) => row.storeId === storeId)?.name,
    ).toBe("변경된 제휴점");
    expect(result.current.stores.getStoreDetail(storeId)?.name).toBe(
      "변경된 제휴점",
    );
  });
  await act(async () => {
    await result.current.benefits.updateBenefit(benefit.benefitId, {
      brand: benefit.brand,
      name: "수정한 혜택",
      category: "카페",
    });
  });
  await waitFor(() =>
    expect(
      result.current.benefits.benefits.find(
        (row) => row.benefitId === benefit.benefitId,
      )?.name,
    ).toBe("수정한 혜택"),
  );
  await act(async () => {
    await result.current.stores.deleteStore(101);
  });
  await waitFor(() =>
    expect(
      result.current.benefits.benefits.find((row) => row.benefitId === 1)
        ?.storeCount,
    ).toBe(0),
  );
  const active = result.current.summary.summary!.active;
  await act(async () => {
    await result.current.users.changeUserStatus(2, "SUSPENDED", "샘플");
  });
  await waitFor(() =>
    expect(result.current.summary.summary!.active).toBe(active - 1),
  );
  unmount();
  const reopened = renderHook(
    () => ({ users: useAdminUsers(), summary: useAdminUserSummary() }),
    { wrapper },
  );
  expect(
    reopened.result.current.users.users.find((row) => row.userId === 2)?.status,
  ).toBe("SUSPENDED");
  expect(reopened.result.current.summary.summary!.active).toBe(active - 1);
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
  client.clear();
});

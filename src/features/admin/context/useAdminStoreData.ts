"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { storeDetails, storeRows } from "@/features/admin/constants/adminData";
import type {
  AdminStoreData,
  StoreSortDirection,
  StoreSortField,
} from "@/features/admin/context/adminDataTypes";
import { adminQueryKeys } from "@/features/admin/context/adminQueryKeys";
import { adminStoreService } from "@/features/admin/lib/adminStoreService";
import type {
  AdminStore,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { env } from "@/shared/config/env";

export const getInitialStoreType = (
  pathname?: string | null,
): AdminStoreType =>
  pathname?.includes("/admin/partners") ? "PARTNER" : "PHONE";

export const useAdminStoreData = (
  initialStoreType: AdminStoreType,
): AdminStoreData => {
  const queryClient = useQueryClient();
  const [stores, setStores] = useState<AdminStore[]>(
    env.apiBaseUrl ? [] : storeRows,
  );
  const [storeDetailRows, setStoreDetailRows] = useState<AdminStoreDetail[]>(
    env.apiBaseUrl ? [] : storeDetails,
  );
  const [storeError] = useState<string | null>(null);
  const [storeKeyword, setStoreKeywordState] = useState("");
  const [storePage, setStorePage] = useState(0);
  const [storePageSize, setStorePageSizeState] = useState(20);
  const [storeSortField, setStoreSortField] =
    useState<StoreSortField>("createdAt");
  const [storeSortDirection, setStoreSortDirection] =
    useState<StoreSortDirection>("desc");
  const [storeTypeFilter, setStoreTypeFilterState] =
    useState<AdminStoreType>(initialStoreType);
  const [storeTotalCount, setStoreTotalCount] = useState(
    env.apiBaseUrl ? 0 : storeRows.length,
  );

  const storeQuery = useQuery({
    enabled: Boolean(env.apiBaseUrl),
    queryFn: () =>
      adminStoreService.fetchStores({
        keyword: storeKeyword,
        page: storePage,
        size: storePageSize,
        sortBy: `${storeSortField},${storeSortDirection}`,
        storeType: storeTypeFilter,
      }),
    queryKey: adminQueryKeys.stores({
      keyword: storeKeyword,
      page: storePage,
      pageSize: storePageSize,
      sortDirection: storeSortDirection,
      sortField: storeSortField,
      storeType: storeTypeFilter,
    }),
  });

  const refreshStores = useCallback(async () => {
    if (!env.apiBaseUrl) return;

    await storeQuery.refetch();
  }, [storeQuery]);

  const currentStores = useMemo(
    () => (env.apiBaseUrl ? (storeQuery.data?.stores ?? []) : stores),
    [storeQuery.data?.stores, stores],
  );
  const currentStoreDetails = useMemo(
    () => (env.apiBaseUrl ? (storeQuery.data?.details ?? []) : storeDetailRows),
    [storeDetailRows, storeQuery.data?.details],
  );
  const currentStoreError =
    env.apiBaseUrl && storeQuery.error
      ? storeQuery.error instanceof Error
        ? storeQuery.error.message
        : "매장 데이터를 불러오지 못했습니다."
      : storeError;
  const currentStoreTotalCount = env.apiBaseUrl
    ? (storeQuery.data?.totalCount ?? 0)
    : storeTotalCount;
  const currentStoreTotalPages = env.apiBaseUrl
    ? Math.max(1, storeQuery.data?.totalPages ?? 1)
    : Math.max(1, Math.ceil(storeTotalCount / storePageSize));

  const setStoreKeyword = useCallback((keyword: string) => {
    setStoreKeywordState(keyword);
    setStorePage(0);
  }, []);

  const setStorePageSize = useCallback((pageSize: number) => {
    setStorePageSizeState(pageSize);
    setStorePage(0);
  }, []);

  const setStoreSort = useCallback(
    (field: StoreSortField, direction: StoreSortDirection) => {
      setStoreSortField(field);
      setStoreSortDirection(direction);
      setStorePage(0);
    },
    [],
  );

  const setStoreTypeFilter = useCallback((storeType: AdminStoreType) => {
    setStoreTypeFilterState(storeType);
    setStoreKeywordState("");
    setStorePage(0);
  }, []);

  return useMemo<AdminStoreData>(
    () => ({
      addStore: async (input) => {
        if (env.apiBaseUrl) {
          await adminStoreService.createStore({
            ...input,
            storeType: storeTypeFilter,
          });
          await queryClient.invalidateQueries({
            queryKey: ["admin", "stores"],
          });
          return;
        }

        const now = new Date().toISOString();
        const nextStoreId =
          Math.max(0, ...storeDetailRows.map((store) => store.storeId)) + 1;
        const nextStore: AdminStoreDetail = {
          ...input,
          createdAt: now,
          storeId: nextStoreId,
          storeType: storeTypeFilter,
          updatedAt: now,
        };

        setStores((currentStores) => [nextStore, ...currentStores]);
        setStoreDetailRows((currentDetails) => [nextStore, ...currentDetails]);
        setStoreTotalCount((currentCount) => currentCount + 1);
      },
      stores: currentStores,
      storeDetails: currentStoreDetails,
      storeError: currentStoreError,
      storeKeyword,
      storePage,
      storePageSize,
      storeSortDirection,
      storeSortField,
      storeTypeFilter,
      storeTotalCount: currentStoreTotalCount,
      storeTotalPages: currentStoreTotalPages,
      isStoreLoading: env.apiBaseUrl
        ? storeQuery.isLoading || storeQuery.isFetching
        : false,
      getStoreDetail: (storeId) =>
        currentStoreDetails.find((store) => store.storeId === storeId),
      refreshStores,
      saveStore: async (storeId, input) => {
        if (env.apiBaseUrl) {
          await adminStoreService.updateStore(storeId, input);
          setStoreSortField("updatedAt");
          setStoreSortDirection("desc");
          setStorePage(0);
          await queryClient.invalidateQueries({
            queryKey: ["admin", "stores"],
          });
          return;
        }

        const existingStore = storeDetailRows.find(
          (store) => store.storeId === storeId,
        );
        const nextStore = {
          ...existingStore,
          ...input,
          storeId,
          createdAt: existingStore?.createdAt ?? new Date().toISOString(),
          storeType: existingStore?.storeType ?? storeTypeFilter,
          updatedAt: new Date().toISOString(),
        } satisfies AdminStoreDetail;

        setStoreSortField("updatedAt");
        setStoreSortDirection("desc");
        setStorePage(0);
        setStores((currentStores) => [
          nextStore,
          ...currentStores.filter((store) => store.storeId !== storeId),
        ]);
        setStoreDetailRows((currentDetails) => [
          nextStore,
          ...currentDetails.filter((store) => store.storeId !== storeId),
        ]);
      },
      saveStores: async (inputs) => {
        if (!env.apiBaseUrl) {
          const updatedAt = new Date().toISOString();

          setStores((currentStores) =>
            currentStores.map((store) =>
              inputs[store.storeId]
                ? { ...store, ...inputs[store.storeId], updatedAt }
                : store,
            ),
          );
          setStoreDetailRows((currentDetails) =>
            currentDetails.map((store) =>
              inputs[store.storeId]
                ? { ...store, ...inputs[store.storeId], updatedAt }
                : store,
            ),
          );
          return;
        }

        await Promise.all(
          Object.entries(inputs).map(([storeId, input]) =>
            adminStoreService.updateStore(Number(storeId), input),
          ),
        );
        await queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      },
      setStoreKeyword,
      setStorePage,
      setStorePageSize,
      setStoreSort,
      setStoreTypeFilter,
      deleteStore: async (storeId) => {
        if (!env.apiBaseUrl) {
          setStores((currentStores) =>
            currentStores.filter((store) => store.storeId !== storeId),
          );
          setStoreDetailRows((currentDetails) =>
            currentDetails.filter((store) => store.storeId !== storeId),
          );
          setStoreTotalCount((currentCount) => Math.max(0, currentCount - 1));
          return;
        }

        await adminStoreService.deleteStore(storeId);
        await queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      },
    }),
    [
      currentStoreDetails,
      currentStoreError,
      currentStores,
      currentStoreTotalCount,
      currentStoreTotalPages,
      queryClient,
      refreshStores,
      setStoreKeyword,
      setStorePageSize,
      setStoreSort,
      setStoreTypeFilter,
      storeDetailRows,
      storeKeyword,
      storePage,
      storePageSize,
      storeQuery.isFetching,
      storeQuery.isLoading,
      storeSortDirection,
      storeSortField,
      storeTypeFilter,
    ],
  );
};

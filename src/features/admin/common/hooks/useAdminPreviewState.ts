"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/** Preview rows share the query client's lifetime across screen navigation. */
export const useAdminPreviewState = <T>(
  name: string,
  initialData: T,
): readonly [T, Dispatch<SetStateAction<T>>] => {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "preview", name],
    queryFn: () => initialData,
    initialData,
    enabled: false,
    gcTime: Infinity,
  });
  const setData = useCallback<Dispatch<SetStateAction<T>>>(
    (update) => {
      client.setQueryData<T>(["admin", "preview", name], (current) =>
        typeof update === "function"
          ? (update as (previous: T) => T)(current ?? initialData)
          : update,
      );
    },
    [client, name, initialData],
  );
  return [query.data ?? initialData, setData];
};

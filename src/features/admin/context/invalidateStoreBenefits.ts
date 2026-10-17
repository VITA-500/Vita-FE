import type { QueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "./adminQueryKeys";

/** 매장과 연결된 혜택 옵션·매장 수를 함께 갱신한다. */
export const invalidateStoreBenefits = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.storesAll }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.benefitsAll }),
  ]);

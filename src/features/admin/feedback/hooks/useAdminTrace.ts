"use client";

import { useQuery } from "@tanstack/react-query";
import { adminAnswerFeedbackApi } from "@/entities/feedback";
import { mockAdminTrace } from "@/features/admin/common/lib/adminData";
import { env } from "@/shared/config/env";

export const useAdminTrace = (messageId: number | null, enabled = true) => {
  const query = useQuery({
    enabled: Boolean(env.apiBaseUrl && messageId && enabled),
    queryKey: ["admin", "trace", messageId],
    queryFn: async () => {
      const list = await adminAnswerFeedbackApi.findTraceByMessageId(
        messageId!,
      );
      const traceId = list.content[0]?.id;
      return traceId === undefined
        ? null
        : adminAnswerFeedbackApi.getTrace(traceId);
    },
  });

  if (!env.apiBaseUrl) {
    return {
      error: null,
      isLoading: false,
      trace: enabled && messageId ? { ...mockAdminTrace, messageId } : null,
    };
  }

  return {
    error: query.error ? "처리 과정을 불러오지 못했어요." : null,
    isLoading: query.isPending,
    trace: query.data ?? null,
  };
};

import type { ChatStreamEvent } from "@/entities/chat/api/apiTypes";
import type { SseEvent } from "@/shared/api/sse";

export const parseStreamEvent = (event: SseEvent): ChatStreamEvent | null => {
  try {
    const p = JSON.parse(event.data);
    if (
      !p ||
      !Number.isSafeInteger(p.sessionId) ||
      !Number.isSafeInteger(p.messageId)
    )
      return null;
    switch (event.event) {
      case "assistant_status":
        if (
          !["thinking", "retrieving_faq", "generating", "retrying"].includes(
            p.status,
          )
        )
          return null;
        break;
      case "assistant_delta":
        if (typeof p.delta !== "string") return null;
        break;
      case "assistant_done":
        if (typeof p.content !== "string") return null;
        if (
          p.actions != null &&
          (!Array.isArray(p.actions) ||
            !p.actions.every(
              (action: { label?: unknown; href?: unknown } | null) =>
                action &&
                typeof action.label === "string" &&
                typeof action.href === "string",
            ))
        )
          return null;
        if (
          p.plans != null &&
          (!Array.isArray(p.plans) ||
            !p.plans.every(
              (plan: { name?: unknown; monthlyFee?: unknown } | null) =>
                plan &&
                typeof plan.name === "string" &&
                typeof plan.monthlyFee === "number",
            ))
        )
          return null;
        if (
          p.storeMap != null &&
          (!Array.isArray(p.storeMap.stores) ||
            !p.storeMap.stores.every(
              (
                store: {
                  id?: unknown;
                  name?: unknown;
                  lat?: unknown;
                  lng?: unknown;
                } | null,
              ) =>
                store &&
                typeof store.id === "string" &&
                typeof store.name === "string" &&
                typeof store.lat === "number" &&
                typeof store.lng === "number",
            ))
        )
          return null;
        break;
      case "assistant_error":
        if (typeof p.code !== "string" || typeof p.message !== "string")
          return null;
        break;
      default:
        return null;
    }
    return { name: event.event, payload: p } as ChatStreamEvent;
  } catch {
    return null;
  }
};

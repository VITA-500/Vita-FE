import { ApiError, requestJson } from "@/shared/api/http";
import {
  createApiUrl,
  readJsonResponse,
  type ApiErrorDetails,
} from "@/shared/api/response";

export const guestHeaders = (guestId?: string) =>
  guestId ? { "X-Guest-Id": guestId } : undefined;

export const createChatApiUrl = (path: string) => createApiUrl(path);

export const requestGuestChatJson = async <T>(
  path: string,
  guestId: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(createChatApiUrl(path), {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": guestId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      (ApiErrorDetails & { message?: string }) | null;

    throw new ApiError(
      errorBody?.message ?? `Chat API failed: ${response.status}`,
      response.status,
      errorBody ?? undefined,
    );
  }

  return readJsonResponse<T>(response);
};

export const requestChatJson = <T>(
  path: string,
  guestId: string | undefined,
  options: RequestInit & { timeoutMs?: number } = {},
) => {
  if (guestId) {
    const { timeoutMs, ...requestOptions } = options;

    return requestGuestChatJson<T>(path, guestId, {
      ...requestOptions,
      signal: timeoutMs
        ? AbortSignal.any([
            AbortSignal.timeout(timeoutMs),
            ...(requestOptions.signal ? [requestOptions.signal] : []),
          ])
        : requestOptions.signal,
    });
  }

  return requestJson<T>(path, options);
};

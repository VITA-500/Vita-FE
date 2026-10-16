import { ApiError, requestJson } from "@/shared/api/http";
import { env } from "@/shared/config/env";

export const guestHeaders = (guestId?: string) =>
  guestId ? { "X-Guest-Id": guestId } : undefined;

export const createChatApiUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${env.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

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
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
      fieldErrors?: { field: string; message: string }[] | null;
    } | null;

    throw new ApiError(
      errorBody?.message ?? `Chat API failed: ${response.status}`,
      response.status,
      errorBody ?? undefined,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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

import { env } from "@/shared/config/env";

type RequestOptions = RequestInit & {
  baseUrl?: string;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const createUrl = (path: string, baseUrl = env.apiBaseUrl) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

export const requestJson = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { baseUrl, headers, timeoutMs, ...requestOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(createUrl(path, baseUrl), {
      credentials: "include",
      ...requestOptions,
      signal: controller?.signal ?? requestOptions.signal,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      throw new ApiError(
        errorBody?.message ?? `API request failed: ${response.status}`,
        response.status,
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
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
};

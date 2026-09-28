import { env } from "@/shared/config/env";

type RequestOptions = RequestInit & {
  baseUrl?: string;
  timeoutMs?: number;
};

type CsrfTokenResponse = {
  headerName: string;
  token: string;
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

let csrfTokenPromise: Promise<CsrfTokenResponse> | null = null;

const shouldAttachCsrfToken = (path: string, method = "GET") => {
  const normalizedMethod = method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
    return false;
  }

  return !path.replace(/^\//, "").startsWith("auth/");
};

const getCsrfToken = async (baseUrl?: string) => {
  csrfTokenPromise ??= requestJson<CsrfTokenResponse>("/auth/csrf", {
    baseUrl,
  }).catch((error) => {
    csrfTokenPromise = null;
    throw error;
  });

  return csrfTokenPromise;
};

export const requestJson = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { baseUrl, headers, timeoutMs, ...requestOptions } = options;
  const needsCsrfToken = shouldAttachCsrfToken(path, requestOptions.method);
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const runRequest = async (csrfToken: CsrfTokenResponse | null) => {
      const response = await fetch(createUrl(path, baseUrl), {
        credentials: "include",
        ...requestOptions,
        signal: controller?.signal ?? requestOptions.signal,
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { [csrfToken.headerName]: csrfToken.token } : {}),
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
    };

    if (!needsCsrfToken) {
      return await runRequest(null);
    }

    try {
      return await runRequest(await getCsrfToken(baseUrl));
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) {
        throw error;
      }

      csrfTokenPromise = null;
      return await runRequest(await getCsrfToken(baseUrl));
    }
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
};

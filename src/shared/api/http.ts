import {
  createApiUrl,
  readJsonResponse,
  type ApiErrorDetails,
} from "@/shared/api/response";

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
  code?: string;
  fieldErrors?: ApiErrorDetails["fieldErrors"];

  constructor(message: string, status: number, details?: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = details?.code;
    this.fieldErrors = details?.fieldErrors;
  }
}

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
  const shouldSetJsonContentType =
    Boolean(requestOptions.body) || requestOptions.method !== undefined;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const runRequest = async (csrfToken: CsrfTokenResponse | null) => {
      const response = await fetch(createApiUrl(path, baseUrl), {
        credentials: "include",
        ...requestOptions,
        signal:
          controller && requestOptions.signal
            ? AbortSignal.any([controller.signal, requestOptions.signal])
            : (controller?.signal ?? requestOptions.signal),
        headers: {
          ...(shouldSetJsonContentType
            ? { "Content-Type": "application/json" }
            : {}),
          ...(csrfToken ? { [csrfToken.headerName]: csrfToken.token } : {}),
          ...headers,
        },
      });

      if (!response.ok) {
        const errorBody = (await response
          .clone()
          .json()
          .catch(async () => {
            const message = await response.text().catch(() => "");

            return message ? { message } : null;
          })) as (ApiErrorDetails & { message?: string }) | null;

        throw new ApiError(
          errorBody?.message ?? `API request failed: ${response.status}`,
          response.status,
          errorBody ?? undefined,
        );
      }

      return await readJsonResponse<T>(response);
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

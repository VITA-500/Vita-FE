import { env } from "@/shared/config/env";

type RequestOptions = RequestInit & {
  baseUrl?: string;
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
  const { baseUrl, headers, ...requestOptions } = options;
  const response = await fetch(createUrl(path, baseUrl), {
    ...requestOptions,
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

  return response.json() as Promise<T>;
};

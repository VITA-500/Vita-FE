import { env } from "@/shared/config/env";

type RequestOptions = RequestInit & {
  baseUrl?: string;
};

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
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

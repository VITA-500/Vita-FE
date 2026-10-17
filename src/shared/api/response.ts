import { env } from "@/shared/config/env";

export type ApiErrorDetails = {
  code?: string;
  fieldErrors?: { field: string; message: string }[] | null;
};

export const createApiUrl = (path: string, baseUrl = env.apiBaseUrl) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

/** HTTP/게스트 채팅 공통 성공 응답 계약. 오류 처리는 각 transport가 담당한다. */
export const readJsonResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

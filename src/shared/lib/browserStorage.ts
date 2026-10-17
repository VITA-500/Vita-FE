/**
 * 브라우저 저장소(localStorage / sessionStorage) 읽기·쓰기.
 * 저장소를 쓸 수 없는 환경(시크릿 모드, 저장 차단, 용량 초과, 서버 렌더링)에서도 예외를 던지지 않는다.
 */
export type BrowserStorageKind = "local" | "session";

const getStorage = (kind: BrowserStorageKind) =>
  kind === "local" ? window.localStorage : window.sessionStorage;

/** 저장된 문자열. 없거나 읽을 수 없으면 null */
export const readStorage = (kind: BrowserStorageKind, key: string) => {
  try {
    return getStorage(kind).getItem(key);
  } catch {
    return null;
  }
};

/** 문자열을 저장한다. 저장할 수 없으면 조용히 넘어간다(메모리 상태만 유지). */
export const writeStorage = (
  kind: BrowserStorageKind,
  key: string,
  value: string,
) => {
  try {
    getStorage(kind).setItem(key, value);
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 기록 없이 진행한다.
  }
};

export const removeStorage = (kind: BrowserStorageKind, key: string) => {
  try {
    getStorage(kind).removeItem(key);
  } catch {
    // 지울 수 없어도 다음 저장 때 덮어쓴다.
  }
};

/**
 * JSON으로 저장한 값. 없거나 읽을 수 없거나 형식이 깨졌으면 null.
 * 형식 검사는 쓰는 쪽에서 한다(그래서 unknown으로 돌려준다).
 */
export const readJsonStorage = (
  kind: BrowserStorageKind,
  key: string,
): unknown => {
  const raw = readStorage(kind, key);

  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const writeJsonStorage = (
  kind: BrowserStorageKind,
  key: string,
  value: unknown,
) => {
  writeStorage(kind, key, JSON.stringify(value));
};

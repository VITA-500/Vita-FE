import type {
  StoreLocation,
  StoreOpenFilter,
} from "@/entities/store/model/types";

const MINUTES_PER_DAY = 24 * 60;
/** "시간 선택" 필터 간격(분). 예약 시간 슬롯과 같은 30분 단위. */
const OPEN_FILTER_INTERVAL_MINUTES = 30;
/** "시간 선택" 필터로 고를 수 있는 시각 범위(매장 영업이 있는 시간대 위주). */
const OPEN_FILTER_FIRST_MINUTES = 7 * 60;
const OPEN_FILTER_LAST_MINUTES = 23 * 60 + 30;

export const ALL_STORE_OPEN_FILTER: StoreOpenFilter = { mode: "all" };

const toMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
};

export const formatTimeValue = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

/** 필터로 고를 수 있는 시각 목록("07:00" ~ "23:30", 30분 간격) */
export const OPEN_FILTER_TIME_OPTIONS = Array.from(
  {
    length:
      (OPEN_FILTER_LAST_MINUTES - OPEN_FILTER_FIRST_MINUTES) /
        OPEN_FILTER_INTERVAL_MINUTES +
      1,
  },
  (_, index) =>
    formatTimeValue(
      OPEN_FILTER_FIRST_MINUTES + index * OPEN_FILTER_INTERVAL_MINUTES,
    ),
);

/** 지금 시각 다음의 30분 단위 시각. "시간 선택"을 처음 켤 때 기본값으로 쓴다. */
export const getNextOpenFilterTime = (now = new Date()) => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next =
    Math.ceil(nowMinutes / OPEN_FILTER_INTERVAL_MINUTES) *
    OPEN_FILTER_INTERVAL_MINUTES;
  const clamped = Math.min(
    Math.max(next, OPEN_FILTER_FIRST_MINUTES),
    OPEN_FILTER_LAST_MINUTES,
  );

  return formatTimeValue(clamped);
};

/**
 * 영업시간 문자열("10:00-20:00", "평일 10:00~20:00" 등)로 time("HH:mm")에 영업 중인지 계산한다.
 * BE BusinessHours.isOpenAt과 같은 기준(여는 시각 포함, 닫는 시각 제외, 자정 넘는 영업 허용).
 * 영업시간을 읽을 수 없으면 undefined.
 */
export const isOpenAtTime = (
  businessHours: string | undefined,
  time: string,
) => {
  const match = businessHours?.match(
    /(\d{1,2}:\d{2})\s*(?:-|~)\s*(\d{1,2}:\d{2})/,
  );
  const target = toMinutes(time);

  if (!match || target === null) return undefined;

  const open = toMinutes(match[1]);
  const close = toMinutes(match[2]);

  if (open === null || close === null || open === close) return undefined;

  const openDuration = (close - open + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const fromOpen = (target - open + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  return fromOpen < openDuration;
};

export type StoreOpenStatus = "before" | "open" | "closed";

const parseBusinessHourRange = (businessHours: string | undefined) => {
  const match = businessHours?.match(
    /(\d{1,2}:\d{2})\s*(?:-|~)\s*(\d{1,2}:\d{2})/,
  );

  if (!match) return null;

  const open = toMinutes(match[1]);
  const close = toMinutes(match[2]);

  if (open === null || close === null || open === close) return null;

  return { close, open };
};

export const getCurrentOpenState = (
  store: Pick<StoreLocation, "businessHours" | "openNow">,
  now = new Date(),
): StoreOpenStatus | undefined => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const range = parseBusinessHourRange(store.businessHours);

  if (!range) {
    return store.openNow === undefined
      ? undefined
      : store.openNow
        ? "open"
        : "closed";
  }

  const isOpen = isOpenAtTime(store.businessHours, formatTimeValue(nowMinutes));

  if (isOpen) return "open";

  const isOvernight = range.close < range.open;

  if (!isOvernight && nowMinutes < range.open) {
    return "before";
  }

  if (isOvernight && nowMinutes > range.close && nowMinutes < range.open) {
    return "before";
  }

  return "closed";
};

/**
 * 지금(브라우저 시각) 영업 중인지. 저장해 둔 채팅 답변처럼 BE openNow가 조회 시점 값으로 굳어 있을 때,
 * 영업시간으로 다시 계산하고 읽을 수 없으면 저장된 openNow를 쓴다.
 */
export const getCurrentOpenStatus = (
  store: Pick<StoreLocation, "businessHours" | "openNow">,
  now = new Date(),
) =>
  getCurrentOpenState(store, now) === "open"
    ? true
    : getCurrentOpenState(store, now) === undefined
      ? undefined
      : false;

/** 주변 매장 조회 쿼리(openNow / openAt). BE는 둘을 함께 받지 않는다. */
export const toOpenFilterParams = (
  filter?: StoreOpenFilter,
): Record<string, string> => {
  if (filter?.mode === "now") return { openNow: "true" };
  if (filter?.mode === "at") return { openAt: filter.time };

  return {};
};

/** 조회 결과를 다시 받을지 판단하는 키 조각 */
export const getOpenFilterKey = (filter: StoreOpenFilter) =>
  filter.mode === "at" ? `at-${filter.time}` : filter.mode;

/** 필터 버튼·안내 문구에 쓰는 이름 */
export const getOpenFilterLabel = (filter: StoreOpenFilter) => {
  if (filter.mode === "now") return "지금 영업 중";
  if (filter.mode === "at") return `${filter.time} 영업 중`;

  return "영업 시간 전체";
};

/**
 * 화면에 이미 있는 매장(검색 풀 등)에도 같은 조건을 적용한다.
 * 판단할 정보가 없는 매장은 숨기지 않는다(BE가 이미 걸러 준 목록일 수 있다).
 */
export const filterStoresByOpenFilter = (
  stores: StoreLocation[],
  filter: StoreOpenFilter,
) => {
  if (filter.mode === "now") {
    return stores.filter((store) => store.openNow !== false);
  }

  if (filter.mode === "at") {
    return stores.filter(
      (store) => isOpenAtTime(store.businessHours, filter.time) !== false,
    );
  }

  return stores;
};

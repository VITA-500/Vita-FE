const SLOT_INTERVAL_MINUTES = 30;
const LAST_RESERVATION_BEFORE_CLOSE_MINUTES = 30;
const RESERVATION_DATE_RANGE_DAYS = 7;

export type ReservationTimeSlot = {
  label: string;
  value: string;
  isPast: boolean;
};

const toMinutes = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
};

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export const getReservationDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getNextReservationDateValue = (date = new Date()) => {
  const nextDate = new Date(date);

  nextDate.setDate(date.getDate() + RESERVATION_DATE_RANGE_DAYS - 1);
  return getReservationDateValue(nextDate);
};

export const parseBusinessHours = (businessHours?: string) => {
  const match = businessHours?.match(
    /(\d{1,2}:\d{2})\s*(?:-|~)\s*(\d{1,2}:\d{2})/,
  );

  if (!match) return null;

  const openMinutes = toMinutes(match[1]);
  const closeMinutes = toMinutes(match[2]);

  if (
    openMinutes === null ||
    closeMinutes === null ||
    openMinutes >= closeMinutes
  ) {
    return null;
  }

  return {
    closeMinutes,
    openMinutes,
  };
};

export const buildReservationTimeSlots = ({
  businessHours,
  date,
  now = new Date(),
}: {
  businessHours?: string;
  date: string;
  now?: Date;
}): ReservationTimeSlot[] => {
  const hours = parseBusinessHours(businessHours);
  const openMinutes = hours?.openMinutes ?? 10 * 60;
  const lastStartMinutes =
    (hours?.closeMinutes ?? 19 * 60) - LAST_RESERVATION_BEFORE_CLOSE_MINUTES;
  const slots: ReservationTimeSlot[] = [];
  const today = getReservationDateValue(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (
    let minutes = openMinutes;
    minutes <= lastStartMinutes;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    const value = formatMinutes(minutes);

    slots.push({
      label: value,
      value,
      isPast: date <= today && minutes <= nowMinutes,
    });
  }

  return slots;
};

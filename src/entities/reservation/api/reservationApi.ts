import type { ReservationResponse } from "@/entities/reservation/model/types";
import { requestJson } from "@/shared/api/http";

/** BE 매장 id(숫자 문자열)인지. 목업·지도 전용 id로는 예약을 보내지 않는다. */
const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

/** 매장 방문 예약 API */
export const reservationApi = {
  createReservation: async ({
    date,
    storeId,
    time,
  }: {
    date: string;
    storeId: string;
    time: string;
  }) => {
    if (!isApiStoreId(storeId)) {
      throw new Error("NON_API_STORE_ID");
    }

    return requestJson<ReservationResponse>(`/stores/${storeId}/reservations`, {
      method: "POST",
      body: JSON.stringify({ date, time }),
      timeoutMs: 7000,
    });
  },
};

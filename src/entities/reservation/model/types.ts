/** POST /stores/{storeId}/reservations 응답 */
export type ReservationResponse = {
  reservationId: number;
  storeId: number;
  storeName: string;
  date: string;
  time: string;
  status: "CONFIRMED" | string;
};

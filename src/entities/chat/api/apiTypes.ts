/** Vita-BE DTO/ChatEvents 계약. 화면 표시 타입과 별도로 관리한다. */
export type ChatSendRequest = { content: string; lat?: number; lng?: number };
export type ChatAssistantStatus = "thinking" | "retrieving_faq" | "generating";
export type ChatApiAction = { label: string; href: string };
export type ChatApiPlan = {
  planId: number;
  planCode: string;
  name: string;
  summary: string | null;
  monthlyFee: number;
  description: string | null;
  networkType: string | null;
  targetGroup: string | null;
  minAge: number | null;
  maxAge: number | null;
  dataPolicy: string | null;
  baseDataMb: number | null;
  exhaustedSpeedKbps: number | null;
  voicePolicy: string | null;
  voiceMinutes: number | null;
  smsPolicy: string | null;
  smsCount: number | null;
};
export type ChatApiStore = {
  id: string;
  name: string;
  address: string;
  businessHours: string | null;
  consultServices: string[] | null;
  phone: string | null;
  providedServices: string[] | null;
  lat: number;
  lng: number;
  distanceText: string | null;
  openNow: boolean | null;
  benefitId: number | null;
  benefitBrand: string | null;
  benefitCategory: string | null;
  benefitName: string | null;
};
export type ChatApiStoreMap = {
  type: "PHONE" | "PARTNER" | null;
  category: string | null;
  benefitId: number | null;
  activeServices: string[] | null;
  origin: { lat: number; lng: number } | null;
  originSource: "current" | "place" | null;
  originLabel: string | null;
  stores: ChatApiStore[];
};
export type ChatMessageResponse = {
  messageId: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";
  answer: string | null;
  relatedFaqIds: number[];
  plans?: readonly ChatApiPlan[] | null;
  /** BE DTO 필드명이 createAt인 것에 주의 */
  createAt: string;
  latencyMs: number;
};
type MessageIdentity = { sessionId: number; messageId: number };
export type ChatStreamEvent =
  | {
      name: "assistant_status";
      payload: MessageIdentity & { status: ChatAssistantStatus };
    }
  | { name: "assistant_delta"; payload: MessageIdentity & { delta: string } }
  | {
      name: "assistant_done";
      payload: MessageIdentity & {
        content: string;
        storeMap?: ChatApiStoreMap | null;
        actions?: readonly ChatApiAction[] | null;
        plans?: readonly ChatApiPlan[] | null;
      };
    }
  | {
      name: "assistant_error";
      payload: MessageIdentity & { code: string; message: string };
    };

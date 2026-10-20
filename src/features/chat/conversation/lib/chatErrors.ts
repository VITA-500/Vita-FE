import { ApiError } from "@/shared/api/http";

export const getChatError = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return {
        status: "expired" as const,
        resetSession: true,
        message:
          "인증이 만료되었어요. 다시 로그인하거나 새 상담을 시작해 주세요.",
      };
    if (error.status === 404)
      return {
        status: "failed" as const,
        resetSession: true,
        message: "상담을 찾을 수 없어요. 다시 시도하면 새 상담을 시작합니다.",
      };
    if (error.status === 403)
      return {
        status: "failed" as const,
        resetSession: false,
        message: "이 상담에 접근할 수 없어요. 로그인 상태를 확인해 주세요.",
      };
    if (error.status === 400)
      return {
        status: "failed" as const,
        resetSession: false,
        message:
          error.code === "LOCATION_REQUIRED"
            ? "위치 권한을 허용한 뒤 다시 질문해 주세요."
            : error.fieldErrors?.map(({ message }) => message).join(" ") ||
              "질문 내용을 확인한 뒤 다시 시도해 주세요.",
      };
    if (error.status === 429)
      return {
        status: "failed" as const,
        resetSession: false,
        message: "요청이 많아요. 잠시 기다린 뒤 다시 시도해 주세요.",
      };
  }
  return {
    status: "failed" as const,
    resetSession: false,
    message: "답변을 받지 못했어요. 잠시 후 다시 시도해 주세요.",
  };
};

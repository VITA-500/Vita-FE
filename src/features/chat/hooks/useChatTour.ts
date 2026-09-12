import { useEffect } from "react";
import { CHAT_TOUR_STORAGE_KEY } from "@/features/chat/constants";

export const useChatTour = () => {
  useEffect(() => {
    let isMounted = true;

    const tourTimer = window.setTimeout(async () => {
      if (window.localStorage.getItem(CHAT_TOUR_STORAGE_KEY) === "true") {
        return;
      }

      const inputElement = document.querySelector("#vita-chat-input-tour");
      const suggestionElement = document.querySelector("#vita-suggestion-tour");
      const storeElement = document.querySelector("#vita-store-map-tour");

      if (!isMounted || !inputElement || !suggestionElement || !storeElement) {
        return;
      }

      const { driver } = await import("driver.js");
      const driverObj = driver({
        animate: true,
        allowClose: true,
        overlayColor: "#111827",
        overlayOpacity: 0.35,
        stagePadding: 4,
        stageRadius: 18,
        popoverClass: "vita-driver-popover",
        nextBtnText: "다음",
        prevBtnText: "이전",
        doneBtnText: "시작하기",
        steps: [
          {
            element: "#vita-chat-input-tour",
            popover: {
              title: "바로 물어보기",
              description: "궁금한 통신 관련 내용을 입력하면 VITA가 답변해드려요.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#vita-suggestion-tour",
            popover: {
              title: "예시로 시작하기",
              description: "무엇을 물어볼지 고민될 때는 추천 질문을 선택해보세요.",
              side: "top",
              align: "start",
            },
          },
          {
            element: "#vita-store-map-tour",
            popover: {
              title: "매장 찾기",
              description: "가까운 매장을 찾거나 위치 기반으로 상담을 이어갈 수 있어요.",
              side: "right",
              align: "center",
            },
          },
        ],
      });

      driverObj.drive();
      window.localStorage.setItem(CHAT_TOUR_STORAGE_KEY, "true");
    }, 650);

    return () => {
      isMounted = false;
      window.clearTimeout(tourTimer);
    };
  }, []);
};

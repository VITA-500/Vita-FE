import type { RouteStyle } from "@/features/store/lib/mapRoute";

/** 교통수단 승하차(환승) 지점 표시. 다음 구간 색의 원 + 가운데 흰 점 */
export const createTransferStopElement = (color: string) => {
  const transferMarker = document.createElement("span");
  const transferMarkerDot = document.createElement("span");

  transferMarker.setAttribute("aria-label", "교통수단 승하차 지점");
  transferMarker.style.display = "flex";
  transferMarker.style.width = "20px";
  transferMarker.style.height = "20px";
  transferMarker.style.alignItems = "center";
  transferMarker.style.justifyContent = "center";
  transferMarker.style.border = `4px solid ${color}`;
  transferMarker.style.borderRadius = "9999px";
  transferMarker.style.background = color;
  transferMarker.style.boxShadow =
    "0 6px 16px rgba(15, 23, 42, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.9)";
  transferMarker.style.pointerEvents = "none";

  transferMarkerDot.style.display = "block";
  transferMarkerDot.style.width = "8px";
  transferMarkerDot.style.height = "8px";
  transferMarkerDot.style.borderRadius = "9999px";
  transferMarkerDot.style.background = "#ffffff";
  transferMarker.appendChild(transferMarkerDot);

  return transferMarker;
};

/** 경로 시작점 표시. 경로 색 테두리의 흰 원 */
export const createRouteOriginElement = (color: string) => {
  const originMarker = document.createElement("span");
  originMarker.setAttribute("aria-label", "경로 시작점");
  originMarker.style.display = "block";
  originMarker.style.width = "16px";
  originMarker.style.height = "16px";
  originMarker.style.border = `4px solid ${color}`;
  originMarker.style.borderRadius = "9999px";
  originMarker.style.background = "#ffffff";
  originMarker.style.boxShadow =
    "0 4px 12px rgba(15, 23, 42, 0.18), inset 0 0 0 2px #ffffff";
  originMarker.style.pointerEvents = "none";

  return originMarker;
};

/** 경로 도착점 표시. 경로 색의 물방울 모양(아래 꼭짓점이 도착 지점) */
export const createRouteDestinationElement = (color: string) => {
  const destinationMarker = document.createElement("span");
  const destinationMarkerDot = document.createElement("span");

  destinationMarker.setAttribute("aria-label", "경로 도착점");
  destinationMarker.style.display = "flex";
  destinationMarker.style.width = "24px";
  destinationMarker.style.height = "24px";
  destinationMarker.style.alignItems = "center";
  destinationMarker.style.justifyContent = "center";
  destinationMarker.style.border = "3px solid #ffffff";
  destinationMarker.style.borderRadius = "50% 50% 50% 0";
  destinationMarker.style.background = color;
  destinationMarker.style.boxShadow = "0 6px 16px rgba(15, 23, 42, 0.22)";
  destinationMarker.style.pointerEvents = "none";
  destinationMarker.style.transform = "rotate(-45deg)";

  destinationMarkerDot.style.display = "block";
  destinationMarkerDot.style.width = "8px";
  destinationMarkerDot.style.height = "8px";
  destinationMarkerDot.style.borderRadius = "9999px";
  destinationMarkerDot.style.background = "#ffffff";
  destinationMarkerDot.style.transform = "rotate(45deg)";
  destinationMarker.appendChild(destinationMarkerDot);

  return destinationMarker;
};

/** 경로를 그리는 동안 선 끝(진행 지점)에 붙는 표시 */
export const createRouteHeadElement = (
  routeStyle: Pick<RouteStyle, "color" | "glow">,
) => {
  const routeHeadMarker = document.createElement("span");
  routeHeadMarker.setAttribute("aria-label", "경로 진행 지점");
  routeHeadMarker.style.display = "block";
  routeHeadMarker.style.width = "18px";
  routeHeadMarker.style.height = "18px";
  routeHeadMarker.style.border = "4px solid #ffffff";
  routeHeadMarker.style.borderRadius = "9999px";
  routeHeadMarker.style.background = routeStyle.color;
  routeHeadMarker.style.boxShadow = `0 0 0 7px ${routeStyle.glow}, 0 8px 18px rgba(15, 23, 42, 0.2)`;
  routeHeadMarker.style.pointerEvents = "none";

  return routeHeadMarker;
};

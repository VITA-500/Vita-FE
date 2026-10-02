"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { RoutePreview } from "@/features/store/lib/mapRoute";

/** 길찾기: 경로를 다 그린 뒤 정보 카드를 띄우기까지의 텀(ms) */
const ROUTE_CARD_REVEAL_DELAY_MS = 220;

type UseRouteDrawingParams = {
  /** 지도 범위 맞춤을 마친 경로 key(지도 메인 effect가 범위를 맞출 때 기록한다) */
  fittedRouteKeyRef: RefObject<string>;
  isKakaoMapReady: boolean;
  onRouteMapReady?: (routeKey: string) => void;
  routePreview?: RoutePreview | null;
};

/**
 * 길찾기 경로 그리기 순서: 지도 범위 맞춤 완료 → 경로 그리기 애니메이션(진행도) → 잠시 뒤 정보 카드 다시 보이기.
 * 범위 맞춤 완료는 지도 메인 effect가 idle(또는 대비 타이머)에서 markRouteFitReadyRef로 알린다.
 */
export const useRouteDrawing = ({
  fittedRouteKeyRef,
  isKakaoMapReady,
  onRouteMapReady,
  routePreview,
}: UseRouteDrawingParams) => {
  // 길찾기: 지도 범위를 맞추고 이동이 끝난 경로 key. 이 key가 되기 전에는 경로를 그리지 않는다.
  const [routeFitReadyKey, setRouteFitReadyKey] = useState("");
  // 길찾기: 경로를 다 그린 뒤 정보 카드를 다시 보여도 되는 경로 key
  const [routeCardRevealKey, setRouteCardRevealKey] = useState("");
  // 범위 맞춤 후 idle을 기다리는 경로 key와 대비용 타이머
  const pendingRouteFitKeyRef = useRef("");
  const routeFitFallbackTimeoutRef = useRef<number | undefined>(undefined);
  const onRouteMapReadyRef = useRef(onRouteMapReady);
  const [routeDrawState, setRouteDrawState] = useState({
    progress: 1,
    routeKey: "",
  });
  const routeDrawProgress =
    routePreview && routeDrawState.routeKey === routePreview.routeKey
      ? routeDrawState.progress
      : 0;
  const routePreviewKey = routePreview?.routeKey ?? "";

  useEffect(() => {
    onRouteMapReadyRef.current = onRouteMapReady;
  });

  /** 지도 범위 맞춤(이동)이 끝났다: 경로 그리기를 시작하고 부모(탐색 중 모달)에 알린다. */
  const markRouteFitReady = (routeKey: string) => {
    if (!routeKey || pendingRouteFitKeyRef.current !== routeKey) {
      return;
    }

    pendingRouteFitKeyRef.current = "";
    window.clearTimeout(routeFitFallbackTimeoutRef.current);
    setRouteFitReadyKey(routeKey);
    onRouteMapReadyRef.current?.(routeKey);
  };
  const markRouteFitReadyRef = useRef(markRouteFitReady);

  useEffect(() => {
    markRouteFitReadyRef.current = markRouteFitReady;
  });

  useEffect(
    () => () => {
      window.clearTimeout(routeFitFallbackTimeoutRef.current);
    },
    [],
  );

  // 길찾기가 끝나거나(경로 없음) 다른 경로를 불러오는 중이면 상태를 비워,
  // 같은 경로를 다시 보여줄 때도 범위 맞춤 → 그리기 → 카드 순서를 처음부터 밟게 한다.
  useEffect(() => {
    if (routePreviewKey) {
      return;
    }

    fittedRouteKeyRef.current = "";
    pendingRouteFitKeyRef.current = "";
    window.clearTimeout(routeFitFallbackTimeoutRef.current);
    // ref·setter는 항상 같은 값이라 의존성에 넣어도 기존과 같은 시점에만 다시 실행된다.
  }, [fittedRouteKeyRef, routePreviewKey]);

  // (상태 초기화는 렌더 중 이전 key와 비교해 처리한다. effect 안 setState는 연쇄 렌더를 만든다)
  const [lastRoutePreviewKey, setLastRoutePreviewKey] =
    useState(routePreviewKey);

  if (lastRoutePreviewKey !== routePreviewKey) {
    setLastRoutePreviewKey(routePreviewKey);

    if (!routePreviewKey) {
      setRouteFitReadyKey("");
      setRouteCardRevealKey("");
    }
  }

  // 지도 SDK가 없으면(대체 화면) 맞출 지도가 없으므로 바로 준비 완료로 본다.
  useEffect(() => {
    if (!isKakaoMapReady && routePreviewKey) {
      pendingRouteFitKeyRef.current = routePreviewKey;
      markRouteFitReadyRef.current(routePreviewKey);
    }
  }, [isKakaoMapReady, routePreviewKey]);

  // 경로를 다 그리면 잠깐 뒤 정보 카드를 자연스럽게 다시 띄운다.
  const isRouteDrawComplete =
    Boolean(routePreviewKey) &&
    routeDrawState.routeKey === routePreviewKey &&
    routeDrawState.progress >= 1;

  useEffect(() => {
    if (!isRouteDrawComplete) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRouteCardRevealKey(routePreviewKey);
    }, ROUTE_CARD_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRouteDrawComplete, routePreviewKey]);

  // 길찾기 중 경로를 그리기 전·그리는 동안에는 정보 카드를 접어 둔다.
  const isRouteCardHeld =
    Boolean(routePreviewKey) && routeCardRevealKey !== routePreviewKey;

  useEffect(() => {
    // 지도 공간이 확보되기 전에는 경로를 그리지 않는다.
    if (!routePreviewKey || routeFitReadyKey !== routePreviewKey) {
      return;
    }

    const startedAt = window.performance.now();
    const durationMs = 1400;
    let frameId = 0;

    const drawFrame = (timestamp: number) => {
      const nextProgress = Math.min((timestamp - startedAt) / durationMs, 1);

      setRouteDrawState({
        progress: nextProgress,
        routeKey: routePreviewKey,
      });

      if (nextProgress < 1) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    frameId = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [routePreviewKey, routeFitReadyKey]);

  return {
    isRouteCardHeld,
    markRouteFitReadyRef,
    pendingRouteFitKeyRef,
    routeDrawProgress,
    routeFitFallbackTimeoutRef,
    routeFitReadyKey,
  };
};

"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * 요소 크기가 바뀔 때마다 1씩 올라가는 key. 크기에 맞춰 위치를 다시 계산해야 하는 effect의 의존성으로 쓴다.
 * watchKey가 바뀌면(요소가 새로 그려질 수 있으므로) 관찰 대상을 다시 잡는다.
 * settleMs를 주면 크기 변화가 그만큼 멈춘 뒤에 한 번만 올린다.
 * (펼치기 애니메이션처럼 매 프레임 크기가 바뀔 때, 무거운 effect가 프레임마다 다시 실행돼 버벅이지 않도록)
 */
export const useElementResizeKey = (
  elementRef: RefObject<HTMLElement | null>,
  watchKey: unknown,
  settleMs = 0,
) => {
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    let settleTimeoutId: number | undefined;
    const bumpResizeKey = () => {
      setResizeKey((key) => key + 1);
    };
    const resizeObserver = new ResizeObserver(() => {
      if (settleMs <= 0) {
        bumpResizeKey();
        return;
      }

      window.clearTimeout(settleTimeoutId);
      settleTimeoutId = window.setTimeout(bumpResizeKey, settleMs);
    });

    resizeObserver.observe(element);

    return () => {
      window.clearTimeout(settleTimeoutId);
      resizeObserver.disconnect();
    };
  }, [elementRef, settleMs, watchKey]);

  return resizeKey;
};

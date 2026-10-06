"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * 요소 크기가 바뀔 때마다 1씩 올라가는 key. 크기에 맞춰 위치를 다시 계산해야 하는 effect의 의존성으로 쓴다.
 * watchKey가 바뀌면(요소가 새로 그려질 수 있으므로) 관찰 대상을 다시 잡는다.
 */
export const useElementResizeKey = (
  elementRef: RefObject<HTMLElement | null>,
  watchKey: unknown,
) => {
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setResizeKey((key) => key + 1);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementRef, watchKey]);

  return resizeKey;
};

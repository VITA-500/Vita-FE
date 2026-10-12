"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * 요소의 현재 높이(px). 내용이 바뀌어 높이가 달라질 때마다 갱신된다.
 * 감싸는 요소의 높이를 이 값으로 애니메이션하면, 내용이 바뀌어도 높이가 한 번에 부드럽게 변한다.
 * watchKey가 바뀌면(요소가 새로 그려질 수 있으므로) 관찰 대상을 다시 잡는다.
 */
export const useElementHeight = (
  elementRef: RefObject<HTMLElement | null>,
  watchKey?: unknown,
) => {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    // ResizeObserver는 관찰을 시작할 때도 한 번 알려 주므로 처음 높이도 여기서 잡힌다.
    const resizeObserver = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementRef, watchKey]);

  return height;
};

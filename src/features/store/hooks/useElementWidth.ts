"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * 요소의 현재 너비(px). 화면 크기(반응형 너비)가 바뀔 때마다 갱신된다.
 * transform으로 밀어 넣고 빼는 패널도 너비 자체는 그대로라, 열림 여부와 상관없이 실제 폭을 잴 수 있다.
 * watchKey가 바뀌면(요소가 새로 그려질 수 있으므로) 관찰 대상을 다시 잡는다.
 */
export const useElementWidth = (
  elementRef: RefObject<HTMLElement | null>,
  watchKey?: unknown,
) => {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      setWidth(element.offsetWidth);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementRef, watchKey]);

  return width;
};

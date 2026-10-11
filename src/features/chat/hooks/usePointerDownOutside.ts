import type { RefObject } from "react";
import { useEffect } from "react";

type UsePointerDownOutsideParams = {
  enabled: boolean;
  ignoredSelector?: string;
  onPointerDownOutside: () => void;
  ref: RefObject<HTMLElement | null>;
};

export const usePointerDownOutside = ({
  enabled,
  ignoredSelector,
  onPointerDownOutside,
  ref,
}: UsePointerDownOutsideParams) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;

      if (ignoredSelector && target.closest(ignoredSelector)) {
        return;
      }

      if (ref.current && !ref.current.contains(target)) {
        onPointerDownOutside();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [enabled, ignoredSelector, onPointerDownOutside, ref]);
};

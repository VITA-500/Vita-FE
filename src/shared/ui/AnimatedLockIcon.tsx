"use client";

import { Lock } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type AnimatedLockIconProps = {
  show: boolean;
  size?: number;
};

// 삭제/저장 버튼이 잠김 ↔ 잠금 해제 상태를 오갈 때, 자물쇠 아이콘이 툭 튀듯
// 나타나거나 사라지지 않도록 부드럽게 페이드 + 스케일 애니메이션을 줘요.
// initial={false}라서 처음 화면에 그려질 때는 애니메이션 없이 바로 보여요.
export const AnimatedLockIcon = ({
  show,
  size = 14,
}: AnimatedLockIconProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          key="lock"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
          }
          className="inline-flex shrink-0"
        >
          <Lock size={size} />
        </motion.span>
      )}
    </AnimatePresence>
  );
};

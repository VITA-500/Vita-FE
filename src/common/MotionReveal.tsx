"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

const MotionReveal = ({
  children,
  className = "",
  delay = 0,
  y = 48,
  once = true,
}: MotionRevealProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        once,
        amount: 0.2,
        margin: "0px 0px -80px 0px",
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 0.75,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default MotionReveal;

"use client";

import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";

const PETALS = Array.from({ length: 12 }, (_, i) => i);

export function PetalBurst({
  show,
  onDone,
}: {
  show: boolean;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show &&
        PETALS.map((i) => (
          <m.span
            key={i}
            initial={{ opacity: 1, y: -20, x: `${10 + i * 7}%`, rotate: 0 }}
            animate={{
              opacity: 0,
              y: 120 + i * 8,
              rotate: 180 + i * 30,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed top-16 z-[100] text-lg"
            onAnimationComplete={i === 0 ? onDone : undefined}
          >
            🌸
          </m.span>
        ))}
    </AnimatePresence>
  );
}

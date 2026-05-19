"use client";

import { useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { slideDown } from "@/lib/motion/variants";

export function WhisperCard({
  text,
  show,
  onDismiss,
}: {
  text: string;
  show: boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          variants={slideDown}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed top-4 left-4 right-4 z-[90] mx-auto max-w-md"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-[20px] bg-cream/95 border border-beige px-5 py-4 text-center shadow-lg backdrop-blur-md"
          >
            <p className="font-display text-base text-ink lowercase">{text}</p>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

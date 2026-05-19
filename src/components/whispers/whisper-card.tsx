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
    <AnimatePresence mode="wait">
      {show && (
        <m.div
          key={text}
          variants={slideDown}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-[20px] bg-cream/95 border border-beige px-4 py-3 text-center shadow-sm backdrop-blur-md"
          >
            <p className="font-display text-sm text-ink lowercase leading-snug">{text}</p>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

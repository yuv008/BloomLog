"use client";

import { m } from "framer-motion";

export function WellnessBloom({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-4">
      <m.div
        className="relative h-32 w-32 rounded-full flex items-center justify-center text-center px-4"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(232,197,192,0.5), rgba(168,184,154,0.35), rgba(184,178,192,0.25))",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-display text-lg text-ink capitalize leading-tight">{label}</span>
      </m.div>
    </div>
  );
}

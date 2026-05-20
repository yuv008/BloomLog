"use client";

import { PetalBurst } from "@/components/motion/petal-burst";
import { useUiStore } from "@/stores/use-ui-store";

export function useCalendarCompletionBloom() {
  const trigger = useUiStore((s) => s.triggerPetalBurst);
  return () => trigger();
}

export function CalendarPetalLayer() {
  const show = useUiStore((s) => s.showPetalBurst);
  const clear = useUiStore((s) => s.clearPetalBurst);
  return <PetalBurst show={show} onDone={clear} />;
}

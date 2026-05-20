"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickLogSheet } from "@/components/food/quick-log-sheet";
import {
  useUserId,
  useInvalidateNourish,
} from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import type { AddFoodLogInput } from "@/lib/data/food-log";
import { trackEvent } from "@/lib/analytics/posthog";
import { useUiStore } from "@/stores/use-ui-store";

function NourishLogContent() {
  const router = useRouter();
  const userId = useUserId();
  const invalidate = useInvalidateNourish();
  const [open, setOpen] = useState(true);
  const [recents, setRecents] = useState<string[]>([]);
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);

  useEffect(() => {
    if (userId) api.getRecentFoodNames(userId).then(setRecents);
  }, [userId]);

  const onSave = async (input: AddFoodLogInput) => {
    if (!userId) return;
    await api.addFoodLog(userId, input);
    invalidate(userId);
    trackEvent("food_logged", {
      source: input.source ?? "quick",
      slot: input.meal_slot,
    });
    triggerPetal();
    router.push("/nourish");
  };

  return (
    <QuickLogSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) router.push("/nourish");
      }}
      onSave={onSave}
      recents={recents}
    />
  );
}

export default function NourishLogPage() {
  return (
    <Suspense fallback={<div className="text-whisper py-8 text-center">opening log…</div>}>
      <NourishLogContent />
    </Suspense>
  );
}

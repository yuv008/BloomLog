"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickLogSheet } from "@/components/food/quick-log-sheet";
import { useUserId, useAddFoodLog } from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import { trackEvent } from "@/lib/analytics/posthog";
import { useUiStore } from "@/stores/use-ui-store";

function NourishLogContent() {
  const router = useRouter();
  const userId = useUserId();
  const addFood = useAddFoodLog(userId);
  const [open, setOpen] = useState(true);
  const [recents, setRecents] = useState<string[]>([]);
  const triggerPetal = useUiStore((s) => s.triggerPetalBurst);

  useEffect(() => {
    if (userId) api.getRecentFoodNames(userId).then(setRecents);
  }, [userId]);

  const onSave = async (
    input: Parameters<typeof addFood.mutateAsync>[0]
  ) => {
    if (!userId) return;
    await addFood.mutateAsync(input);
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/primitives/button";
import * as api from "@/lib/data/api";
import type { RoomTheme, CalorieDisplay, MacroStyle } from "@/lib/types";
import { defaultCalorieTarget } from "@/lib/health/wellness-score";
import { HEALTH_DISCLAIMER } from "@/lib/health/copy";
import { trackEvent } from "@/lib/analytics/posthog";
import { detectDefaultLocale } from "@/lib/locale/detect";

const ROOMS: { id: RoomTheme; label: string; emoji: string }[] = [
  { id: "windowsill", label: "windowsill", emoji: "🪟" },
  { id: "balcony", label: "balcony", emoji: "🌿" },
  { id: "nook", label: "reading nook", emoji: "📚" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [room, setRoom] = useState<RoomTheme>("windowsill");
  const [calorieMode, setCalorieMode] = useState<CalorieDisplay | "skip">("skip");
  const [macroStyle, setMacroStyle] = useState<MacroStyle>("balanced");
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    const { userId } = await api.ensureAuth();
    const locale = detectDefaultLocale();
    const profile = await api.upsertProfile(userId, {
      display_name: name.trim() || null,
      room_theme: room,
      onboarding_complete: true,
      currency: locale.currency,
      timezone: locale.timezone,
      health_onboarding_done: true,
      calorie_display: calorieMode === "skip" ? "hidden" : calorieMode,
      soft_calorie_target:
        calorieMode === "skip" ? null : defaultCalorieTarget(macroStyle),
      macro_style: macroStyle,
    });
    qc.setQueryData(["profile", userId], profile);
    await qc.invalidateQueries({ queryKey: ["profile", userId] });
    trackEvent("onboarding_complete");
    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-beige/40 flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <m.div
            key="0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="max-w-sm text-center space-y-6"
          >
            <p className="text-5xl">🌸</p>
            <h1 className="font-display text-3xl text-ink">a soft place to land your day</h1>
            <p className="text-whisper text-sm">
              mood, water, tiny wins — about 60 seconds. no streaks. no guilt.
            </p>
            <Button className="w-full" onClick={() => setStep(1)}>
              begin gently
            </Button>
          </m.div>
        )}
        {step === 1 && (
          <m.div
            key="1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="max-w-sm w-full space-y-6"
          >
            <h2 className="font-display text-2xl text-ink text-center">what should we call you?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="optional"
              className="w-full rounded-[28px] border border-beige bg-cream/80 px-5 py-4 text-ink placeholder:text-whisper focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <Button className="w-full" onClick={() => setStep(2)}>
              continue
            </Button>
          </m.div>
        )}
        {step === 2 && (
          <m.div
            key="health"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="max-w-sm w-full space-y-6"
          >
            <h2 className="font-display text-2xl text-ink text-center">gentle nourishment?</h2>
            <p className="text-sm text-whisper text-center">{HEALTH_DISCLAIMER}</p>
            <div className="grid gap-2">
              {(
                [
                  { id: "skip" as const, label: "polaroids only", emoji: "📷" },
                  { id: "soft" as const, label: "soft calorie guide", emoji: "🌿" },
                  { id: "open" as const, label: "show numbers openly", emoji: "✨" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCalorieMode(opt.id)}
                  className={`flex items-center gap-4 rounded-[20px] p-4 text-left ${
                    calorieMode === opt.id ? "bg-blush/40 ring-1 ring-blush" : "bg-beige/30"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-ink text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
            {calorieMode !== "skip" && (
              <div className="flex flex-wrap gap-2 justify-center">
                {(["balanced", "protein_forward", "gentle"] as MacroStyle[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMacroStyle(s)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      macroStyle === s ? "bg-sage/40 text-ink" : "bg-beige/40 text-whisper"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
            <Button className="w-full" onClick={() => setStep(3)}>
              continue
            </Button>
          </m.div>
        )}
        {step === 3 && (
          <m.div
            key="2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="max-w-sm w-full space-y-6"
          >
            <h2 className="font-display text-2xl text-ink text-center">pick your room</h2>
            <div className="grid gap-3">
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoom(r.id)}
                  className={`flex items-center gap-4 rounded-[20px] p-4 text-left ${
                    room === r.id ? "bg-blush/40 ring-1 ring-blush" : "bg-beige/30"
                  }`}
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <span className="text-ink capitalize">{r.label}</span>
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={finish} disabled={loading}>
              {loading ? "planting seeds…" : "enter your garden"}
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </main>
  );
}

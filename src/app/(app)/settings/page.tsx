"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import * as Switch from "@radix-ui/react-switch";
import { Button } from "@/components/primitives/button";
import { useUserId, useProfile } from "@/hooks/use-bloom-data";
import * as api from "@/lib/data/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  requestNotificationPermission,
  scheduleCozyHourReminder,
} from "@/lib/notifications/push";
import { CURRENCY_OPTIONS, normalizeCurrency } from "@/lib/locale/currencies";
import {
  TIMEZONE_GROUPS,
  detectTimezone,
  timezoneLabel,
} from "@/lib/locale/timezones";
import { useUserPreferences } from "@/components/providers/user-preferences";
import { RoutineList } from "@/components/settings/routine-list";

export default function SettingsPage() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { currency, timezone } = useUserPreferences();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  const update = async (patch: Parameters<typeof api.upsertProfile>[1]) => {
    if (!userId) return;
    await api.upsertProfile(userId, patch);
    qc.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const invalidateDateQueries = () => {
    if (!userId) return;
    qc.invalidateQueries({ queryKey: ["daily", userId] });
    qc.invalidateQueries({ queryKey: ["expenses", userId] });
    qc.invalidateQueries({ queryKey: ["expenses-month", userId] });
    qc.invalidateQueries({ queryKey: ["meals", userId] });
    qc.invalidateQueries({ queryKey: ["foodLog", userId] });
    qc.invalidateQueries({ queryKey: ["nourish", "summary", userId] });
    qc.invalidateQueries({ queryKey: ["quests", userId] });
    qc.invalidateQueries({ queryKey: ["journal", userId] });
    qc.invalidateQueries({ queryKey: ["hydrationStreak", userId] });
    qc.invalidateQueries({ queryKey: ["calendar", userId] });
    qc.invalidateQueries({ queryKey: ["calendarRange", userId] });
    qc.invalidateQueries({ queryKey: ["calendarAgenda", userId] });
  };

  const handleExport = async () => {
    if (!userId) return;
    setExporting(true);
    const data = await api.exportUserData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloomlog-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setExporting(false);
  };

  const handleDelete = async () => {
    if (!userId || !confirm("delete all your garden data? this cannot be undone.")) return;
    await api.deleteAllUserData(userId);
    window.location.href = "/onboarding";
  };

  const deviceTz = detectTimezone();
  const tzOptions = [
    { id: deviceTz, label: `device (${timezoneLabel(deviceTz)})` },
    ...TIMEZONE_GROUPS.flatMap((g) => g.zones).filter((z) => z.id !== deviceTz),
  ];

  return (
    <div className="space-y-6 pb-8 w-full min-w-0 max-w-full overflow-x-hidden">
      <h1 className="font-display text-2xl text-ink">settings</h1>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-sm text-whisper">appearance</h2>
        <div className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            day garden
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            night garden
          </Button>
        </div>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-sm text-whisper">region & rhythm</h2>
        <label className="block space-y-2">
          <span className="text-sm text-ink">money shows in</span>
          <select
            value={currency}
            onChange={async (e) => {
              await update({ currency: normalizeCurrency(e.target.value) });
            }}
            className="w-full max-w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-sm text-ink"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-ink">your days start at midnight in</span>
          <select
            value={timezone}
            onChange={async (e) => {
              await update({ timezone: e.target.value });
              invalidateDateQueries();
            }}
            className="w-full max-w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-sm text-ink"
          >
            {tzOptions.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-sm text-whisper">cozy hour reminder</h2>
        <label className="flex items-center justify-between">
          <span className="text-sm text-ink">gentle daily ping</span>
          <Switch.Root
            checked={profile?.notifications_enabled ?? false}
            onCheckedChange={async (checked) => {
              await update({ notifications_enabled: checked });
              if (checked) {
                const ok = await requestNotificationPermission();
                if (ok)
                  scheduleCozyHourReminder(profile?.cozy_hour ?? "21:00", timezone);
              }
            }}
            className="w-11 h-6 rounded-full bg-beige data-[state=checked]:bg-sage relative"
          >
            <Switch.Thumb className="block w-5 h-5 rounded-full bg-cream transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </label>
        <input
          type="time"
          defaultValue={profile?.cozy_hour?.slice(0, 5) ?? "21:00"}
          onChange={(e) => {
            update({ cozy_hour: e.target.value });
            if (profile?.notifications_enabled) {
              scheduleCozyHourReminder(e.target.value, timezone);
            }
          }}
          className="w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-ink"
        />
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-sm text-whisper">nourish</h2>
        <label className="block space-y-2">
          <span className="text-sm text-ink">calorie display</span>
          <select
            value={profile?.calorie_display ?? "soft"}
            onChange={(e) =>
              update({
                calorie_display: e.target.value as "hidden" | "soft" | "open",
                health_onboarding_done: true,
              })
            }
            className="w-full max-w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-sm text-ink"
          >
            <option value="hidden">listening mode</option>
            <option value="soft">soft guide</option>
            <option value="open">open numbers</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-ink">gentle daily guide (kcal)</span>
          <input
            type="number"
            min={1200}
            max={4000}
            placeholder="optional"
            value={profile?.soft_calorie_target ?? ""}
            onChange={(e) => {
              const v = e.target.value ? parseInt(e.target.value, 10) : null;
              update({ soft_calorie_target: v });
            }}
            className="w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-ink"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-ink">water goal (ml)</span>
          <input
            type="number"
            min={1000}
            max={4000}
            step={250}
            value={profile?.water_goal_ml ?? 2000}
            onChange={(e) => update({ water_goal_ml: parseInt(e.target.value, 10) || 2000 })}
            className="w-full rounded-[20px] border border-beige bg-cream/50 px-4 py-2 text-ink"
          />
        </label>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h2 className="text-sm text-whisper">finance card</h2>
        <label className="flex items-center justify-between">
          <span className="text-sm text-ink">show spend bubbles</span>
          <Switch.Root
            checked={profile?.finance_enabled ?? true}
            onCheckedChange={(checked) => update({ finance_enabled: checked })}
            className="w-11 h-6 rounded-full bg-beige data-[state=checked]:bg-sage relative"
          >
            <Switch.Thumb className="block w-5 h-5 rounded-full bg-cream transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </label>
      </section>

      {userId && <RoutineList userId={userId} />}

      <section className="glass-card p-5 space-y-3">
        <h2 className="text-sm text-whisper">your data</h2>
        <Button variant="ghost" className="w-full" onClick={handleExport} disabled={exporting}>
          export json
        </Button>
        <Button variant="ghost" className="w-full text-blush" onClick={handleDelete}>
          delete everything
        </Button>
      </section>
    </div>
  );
}

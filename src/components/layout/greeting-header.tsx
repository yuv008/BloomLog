"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { timeGreeting } from "@/lib/dates";
import { useUserPreferences } from "@/components/providers/user-preferences";

export function GreetingHeader({ name }: { name?: string | null }) {
  const { timezone } = useUserPreferences();

  return (
    <header className="flex items-start justify-between px-1 py-2">
      <div>
        <p className="font-display text-2xl text-ink capitalize">
          {timeGreeting(name, timezone)}
        </p>
        <p className="text-sm text-whisper mt-0.5">a quiet minute for today</p>
      </div>
    </header>
  );
}

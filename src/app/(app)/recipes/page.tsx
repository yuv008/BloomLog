"use client";

import Link from "next/link";
import { RECIPES, getSundayRecipe } from "@/lib/recipes/data";
import { cn } from "@/lib/utils";

export default function RecipesPage() {
  const sunday = getSundayRecipe();
  const isSunday = new Date().getDay() === 0;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="font-display text-2xl text-ink">recipe nook</h1>
        <p className="text-sm text-whisper">15 cozy ideas · no ratings · no comments</p>
      </div>

      {isSunday && (
        <Link
          href={`/recipes/${sunday.slug}`}
          className={cn(
            "block rounded-[28px] p-6 bg-gradient-to-br shadow-sm",
            sunday.gradient
          )}
        >
          <p className="text-xs text-whisper uppercase tracking-wide">this week&apos;s cozy idea</p>
          <p className="font-display text-2xl text-ink mt-1">
            {sunday.emoji} {sunday.title}
          </p>
        </Link>
      )}

      <div className="columns-2 gap-3 space-y-3">
        {RECIPES.map((r) => (
          <Link
            key={r.slug}
            href={`/recipes/${r.slug}`}
            className={cn(
              "break-inside-avoid block rounded-[20px] p-4 mb-3 bg-gradient-to-br",
              r.gradient
            )}
          >
            <span className="text-3xl">{r.emoji}</span>
            <p className="font-display text-base text-ink mt-2">{r.title}</p>
            <p className="text-xs text-whisper">{r.time}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

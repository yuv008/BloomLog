"use client";

import Link from "next/link";
import { RECIPES, getSundayRecipe } from "@/lib/recipes/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/primitives/button";

export default function NourishRecipesPage() {
  const sunday = getSundayRecipe();
  const isSunday = new Date().getDay() === 0;

  return (
    <div className="space-y-6 pb-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/nourish" className="text-xs text-sage">
            ← nourish
          </Link>
          <h1 className="font-display text-2xl text-ink mt-1">recipe nook</h1>
          <p className="text-sm text-whisper">cozy ideas · no ratings</p>
        </div>
        <Button asChild size="sm" variant="blush">
          <Link href="/nourish/recipes/generate">AI cook</Link>
        </Button>
      </div>

      {isSunday && (
        <Link
          href={`/nourish/recipes/${sunday.slug}`}
          className={cn(
            "block rounded-[28px] p-6 bg-gradient-to-br shadow-sm",
            sunday.gradient
          )}
        >
          <p className="text-xs text-whisper uppercase tracking-wide">this week&apos;s cozy idea</p>
          <p className="font-display text-2xl text-ink mt-1 break-words">
            {sunday.emoji} {sunday.title}
          </p>
        </Link>
      )}

      <div className="columns-2 gap-3 space-y-3">
        {RECIPES.map((r) => (
          <Link
            key={r.slug}
            href={`/nourish/recipes/${r.slug}`}
            className={cn(
              "break-inside-avoid block rounded-[20px] p-4 mb-3 bg-gradient-to-br",
              r.gradient
            )}
          >
            <span className="text-3xl">{r.emoji}</span>
            <p className="font-display text-base text-ink mt-2 break-words">{r.title}</p>
            <p className="text-xs text-whisper">{r.time}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

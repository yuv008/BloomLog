"use client";

import { Card } from "@/components/primitives/card";

export function MoodFoodWhisper({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Card className="border-lavender-gray/30 bg-lavender-gray/10">
      <p className="text-sm text-ink leading-relaxed">{text}</p>
    </Card>
  );
}

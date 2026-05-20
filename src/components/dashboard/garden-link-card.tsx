"use client";

import Link from "next/link";
import { Flower2 } from "lucide-react";
import { Card } from "@/components/primitives/card";

export function GardenLinkCard() {
  return (
    <Link href="/garden" className="block">
      <Card className="glass-card border-beige/30 p-4 transition-colors hover:border-sage/30">
        <div className="flex items-center gap-3">
          <Flower2 className="h-5 w-5 text-sage" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink">your garden</p>
            <p className="text-xs text-whisper">mood, blooms, and quiet reflection</p>
          </div>
          <span className="ml-auto text-xs text-sage">visit →</span>
        </div>
      </Card>
    </Link>
  );
}

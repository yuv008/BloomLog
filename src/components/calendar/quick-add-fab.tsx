"use client";

import { Plus } from "lucide-react";

export function QuickAddFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-sage/80 text-cream shadow-lg"
      aria-label="add plan"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

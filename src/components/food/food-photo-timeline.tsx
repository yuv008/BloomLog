"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { FoodLogEntry } from "@/lib/types";
import {
  fetchSignedMealPhotoUrl,
  hasMealPhoto,
  isFoodEntryUploading,
  isInlinePhoto,
  mealPhotoStoragePath,
} from "@/lib/media/meal-photo-url";

export function MealPolaroidPhoto({ entry }: { entry: FoodLogEntry }) {
  const uploading = isFoodEntryUploading(entry);
  const storagePath = mealPhotoStoragePath(entry);
  const inline = isInlinePhoto(entry.photo_url);
  const [src, setSrc] = useState<string | null>(
    inline ? entry.photo_url : uploading ? entry.photo_url : null
  );

  useEffect(() => {
    if (uploading || inline) {
      setSrc(entry.photo_url);
      return;
    }
    if (!storagePath) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    fetchSignedMealPhotoUrl(storagePath).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [entry.id, entry.photo_url, storagePath, uploading, inline]);

  if (!src && !uploading) return null;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-beige/30">
      {uploading && (
        <div
          className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-beige/20 via-cream/60 to-beige/20"
          aria-hidden
        />
      )}
      {src && (
        <Image
          src={src}
          alt={entry.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 45vw, 200px"
          unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
          loading="lazy"
        />
      )}
    </div>
  );
}

export function FoodPhotoTimeline({
  entries,
  compact = false,
}: {
  entries: FoodLogEntry[];
  compact?: boolean;
}) {
  const withPhotos = entries.filter(hasMealPhoto);
  if (withPhotos.length === 0) return null;

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {withPhotos.slice(0, 6).map((e) => (
          <div
            key={e.id}
            className="relative h-14 w-14 shrink-0 rounded-[10px] overflow-hidden bg-beige/30"
          >
            <MealPolaroidPhoto entry={e} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {withPhotos.map((e) => (
        <article
          key={e.id}
          className="rounded-[16px] border border-beige/60 bg-cream/80 p-2 rotate-[0.4deg] even:-rotate-[0.4deg]"
        >
          <MealPolaroidPhoto entry={e} />
          <p className="mt-2 text-xs text-ink truncate px-0.5">{e.name}</p>
        </article>
      ))}
    </div>
  );
}

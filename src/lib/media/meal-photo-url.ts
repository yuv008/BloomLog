import type { FoodLogEntry } from "@/lib/types";

export function isInlinePhoto(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

export function mealPhotoStoragePath(entry: FoodLogEntry): string | null {
  const meta = entry.source_meta as { photo_thumb_path?: string };
  if (meta?.photo_thumb_path) return meta.photo_thumb_path;
  if (entry.photo_url && !isInlinePhoto(entry.photo_url)) return entry.photo_url;
  return null;
}

export function isFoodEntryUploading(entry: FoodLogEntry): boolean {
  return !!(entry.source_meta as { uploading?: boolean })?.uploading;
}

export function hasMealPhoto(entry: FoodLogEntry): boolean {
  return !!(entry.photo_url || mealPhotoStoragePath(entry));
}

export async function fetchSignedMealPhotoUrl(path: string): Promise<string | null> {
  const res = await fetch(`/api/media/meal-photo?path=${encodeURIComponent(path)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

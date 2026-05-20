const STORAGE_KEY = "quest_garden_granted";

function readGranted(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeGranted(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function questGardenDayKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

export function hasQuestGardenGrantedToday(
  userId: string,
  date: string
): boolean {
  const map = readGranted();
  return !!map[questGardenDayKey(userId, date)];
}

export function markQuestGardenGrantedToday(
  userId: string,
  date: string
): void {
  const map = readGranted();
  map[questGardenDayKey(userId, date)] = true;
  writeGranted(map);
}

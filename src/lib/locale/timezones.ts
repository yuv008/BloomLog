export const DEFAULT_TIMEZONE = "UTC";

export const TIMEZONE_GROUPS: { label: string; zones: { id: string; label: string }[] }[] =
  [
    {
      label: "Americas",
      zones: [
        { id: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
        { id: "America/Denver", label: "Mountain (Denver)" },
        { id: "America/Chicago", label: "Central (Chicago)" },
        { id: "America/New_York", label: "Eastern (New York)" },
        { id: "America/Toronto", label: "Toronto" },
        { id: "America/Mexico_City", label: "Mexico City" },
        { id: "America/Sao_Paulo", label: "São Paulo" },
      ],
    },
    {
      label: "Europe",
      zones: [
        { id: "Europe/London", label: "London" },
        { id: "Europe/Paris", label: "Paris" },
        { id: "Europe/Berlin", label: "Berlin" },
        { id: "Europe/Zurich", label: "Zurich" },
      ],
    },
    {
      label: "Asia & Pacific",
      zones: [
        { id: "Asia/Kolkata", label: "India (Kolkata)" },
        { id: "Asia/Dubai", label: "Dubai" },
        { id: "Asia/Singapore", label: "Singapore" },
        { id: "Asia/Tokyo", label: "Tokyo" },
        { id: "Australia/Sydney", label: "Sydney" },
        { id: "Pacific/Auckland", label: "Auckland" },
      ],
    },
    {
      label: "Other",
      zones: [{ id: "UTC", label: "UTC" }],
    },
  ];

export const ALL_TIMEZONE_IDS = TIMEZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.id));

export function detectTimezone(): string {
  if (typeof Intl === "undefined") return DEFAULT_TIMEZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function isKnownTimezone(tz: string): boolean {
  return ALL_TIMEZONE_IDS.includes(tz) || tz.includes("/");
}

export function normalizeTimezone(tz: string | null | undefined): string {
  if (tz && isKnownTimezone(tz)) return tz;
  return detectTimezone();
}

export function timezoneLabel(tz: string): string {
  for (const group of TIMEZONE_GROUPS) {
    const found = group.zones.find((z) => z.id === tz);
    if (found) return found.label;
  }
  return tz.replace(/_/g, " ");
}

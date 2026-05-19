import { DEFAULT_CURRENCY, isSupportedCurrency } from "@/lib/locale/currencies";
import { detectTimezone } from "@/lib/locale/timezones";

export function detectDefaultCurrency(): string {
  if (typeof navigator === "undefined") return DEFAULT_CURRENCY;
  try {
    const locale = navigator.language || "en-IN";
    const region = locale.split("-")[1]?.toUpperCase();
    const regionMap: Record<string, string> = {
      US: "USD",
      GB: "GBP",
      IN: "INR",
      AU: "AUD",
      CA: "CAD",
      JP: "JPY",
      SG: "SGD",
      AE: "AED",
      NZ: "NZD",
      CH: "CHF",
      MX: "MXN",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      NL: "EUR",
    };
    if (region && regionMap[region] && isSupportedCurrency(regionMap[region])) {
      return regionMap[region];
    }
    if (locale.startsWith("en")) return "USD";
    if (locale.startsWith("de") || locale.startsWith("fr")) return "EUR";
  } catch {
    /* fall through */
  }
  return DEFAULT_CURRENCY;
}

export function detectDefaultLocale(): { currency: string; timezone: string } {
  return {
    currency: detectDefaultCurrency(),
    timezone: detectTimezone(),
  };
}

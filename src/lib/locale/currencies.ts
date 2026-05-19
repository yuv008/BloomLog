export const DEFAULT_CURRENCY = "INR";

export const SUPPORTED_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "SGD",
  "AED",
  "NZD",
  "CHF",
  "MXN",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_OPTIONS: { code: SupportedCurrency; label: string }[] = [
  { code: "INR", label: "Indian rupee (INR)" },
  { code: "USD", label: "US dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British pound (GBP)" },
  { code: "CAD", label: "Canadian dollar (CAD)" },
  { code: "AUD", label: "Australian dollar (AUD)" },
  { code: "JPY", label: "Japanese yen (JPY)" },
  { code: "SGD", label: "Singapore dollar (SGD)" },
  { code: "AED", label: "UAE dirham (AED)" },
  { code: "NZD", label: "New Zealand dollar (NZD)" },
  { code: "CHF", label: "Swiss franc (CHF)" },
  { code: "MXN", label: "Mexican peso (MXN)" },
];

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function normalizeCurrency(code: string | null | undefined): SupportedCurrency {
  if (code && isSupportedCurrency(code)) return code;
  return DEFAULT_CURRENCY;
}

import { normalizeCurrency } from "@/lib/locale/currencies";

export function formatMoney(
  amount: number,
  currency: string,
  opts?: { compact?: boolean; maximumFractionDigits?: number }
): string {
  const code = normalizeCurrency(currency);
  const maximumFractionDigits =
    opts?.maximumFractionDigits ?? (code === "JPY" ? 0 : opts?.compact ? 0 : 0);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(maximumFractionDigits)}`;
  }
}

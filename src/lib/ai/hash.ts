export function hashIngredients(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9+,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(",");
  let h = 0;
  for (let i = 0; i < normalized.length; i++) {
    h = (h << 5) - h + normalized.charCodeAt(i);
    h |= 0;
  }
  return `ing_${Math.abs(h)}`;
}

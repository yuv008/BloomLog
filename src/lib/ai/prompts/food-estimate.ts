export function foodEstimatePrompt(description: string): string {
  return `Estimate nutrition for a home portion of: "${description}"

Return JSON only: {"name","calories","protein_g","carbs_g","fat_g","confidence":"low"|"medium","note?"}
- Rough estimates only, not medical advice
- note should remind estimates vary (optional, max 80 chars)`;
}

export interface GardenItemDef {
  key: string;
  name: string;
  story: string;
  emoji: string;
  rare?: boolean;
}

export const GARDEN_ITEMS: GardenItemDef[] = [
  { key: "sage_flower", name: "sage bloom", story: "from a tiny quest completed", emoji: "🌿" },
  { key: "blush_rose", name: "blush rose", story: "from filling your bottle", emoji: "🌸" },
  { key: "moon_lamp", name: "moon lamp", story: "from a soft sleep night", emoji: "🌙", rare: true },
  { key: "teacup", name: "little teacup", story: "from a cozy mood day", emoji: "🍵" },
  { key: "hanging_light", name: "hanging light", story: "from a golden hour", emoji: "✨", rare: true },
  { key: "fern", name: "quiet fern", story: "from walking outside", emoji: "🪴" },
  { key: "star_jar", name: "star jar", story: "from a dreamy evening", emoji: "⭐", rare: true },
  { key: "sleeping_cat", name: "sleeping cat", story: "a rare cozy gift", emoji: "🐱", rare: true },
  { key: "kitchen_pitcher", name: "kitchen pitcher", story: "from a week of gentle sips", emoji: "🫖" },
  { key: "herb_pot", name: "herb pot", story: "from cooking at home", emoji: "🌿" },
  { key: "wooden_spoon", name: "wooden spoon", story: "from nourishing yourself", emoji: "🥄", rare: true },
];

export function getGardenItem(key: string): GardenItemDef | undefined {
  return GARDEN_ITEMS.find((i) => i.key === key);
}

export function randomGardenReward(seed: number, rare: boolean): GardenItemDef {
  const pool = GARDEN_ITEMS.filter((i) => (rare ? i.rare : !i.rare));
  const list = pool.length ? pool : GARDEN_ITEMS;
  return list[seed % list.length];
}

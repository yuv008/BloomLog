"use client";

import { addGardenItem, getGardenItems } from "@/lib/data/api";

export async function maybeAwardKitchenPitcher(userId: string, streak: number) {
  if (streak < 7) return;
  const items = await getGardenItems(userId);
  if (items.some((i) => i.item_key === "kitchen_pitcher")) return;
  await addGardenItem(userId, "kitchen_pitcher", { x: 55, y: 42, layer: 2 });
}

export async function maybeAwardHerbPot(userId: string, homemadeCount: number) {
  if (homemadeCount < 3) return;
  const items = await getGardenItems(userId);
  if (items.some((i) => i.item_key === "herb_pot")) return;
  await addGardenItem(userId, "herb_pot", { x: 35, y: 55, layer: 1 });
}

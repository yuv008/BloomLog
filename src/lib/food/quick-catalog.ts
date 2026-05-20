import type { MealSlot } from "@/lib/types";

export interface QuickFoodItem {
  id: string;
  name: string;
  emoji: string;
  meal_slot: MealSlot;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const QUICK_FOOD_CATALOG: QuickFoodItem[] = [
  { id: "oat-bowl", name: "honey oat bowl", emoji: "🥣", meal_slot: "breakfast", calories: 320, protein_g: 10, carbs_g: 52, fat_g: 8 },
  { id: "avocado-toast", name: "avocado toast", emoji: "🥑", meal_slot: "breakfast", calories: 280, protein_g: 8, carbs_g: 28, fat_g: 16 },
  { id: "chai", name: "masala chai", emoji: "☕", meal_slot: "cafe_drink", calories: 120, protein_g: 4, carbs_g: 18, fat_g: 4 },
  { id: "latte", name: "soft latte", emoji: "☕", meal_slot: "cafe_drink", calories: 150, protein_g: 6, carbs_g: 14, fat_g: 7 },
  { id: "salad", name: "garden salad", emoji: "🥗", meal_slot: "lunch", calories: 220, protein_g: 8, carbs_g: 18, fat_g: 12 },
  { id: "dal-rice", name: "dal & rice", emoji: "🍛", meal_slot: "lunch", calories: 450, protein_g: 14, carbs_g: 72, fat_g: 10 },
  { id: "sandwich", name: "veggie sandwich", emoji: "🥪", meal_slot: "lunch", calories: 380, protein_g: 12, carbs_g: 48, fat_g: 14 },
  { id: "pasta", name: "cozy pasta", emoji: "🍝", meal_slot: "dinner", calories: 520, protein_g: 16, carbs_g: 68, fat_g: 18 },
  { id: "stir-fry", name: "veggie stir-fry", emoji: "🥘", meal_slot: "dinner", calories: 400, protein_g: 14, carbs_g: 42, fat_g: 16 },
  { id: "soup", name: "tomato soup", emoji: "🍅", meal_slot: "dinner", calories: 180, protein_g: 4, carbs_g: 24, fat_g: 8 },
  { id: "fruit", name: "fresh fruit", emoji: "🍓", meal_slot: "snack", calories: 90, protein_g: 1, carbs_g: 22, fat_g: 0 },
  { id: "nuts", name: "handful of nuts", emoji: "🥜", meal_slot: "snack", calories: 180, protein_g: 6, carbs_g: 6, fat_g: 16 },
  { id: "yogurt", name: "yogurt cup", emoji: "🥛", meal_slot: "snack", calories: 140, protein_g: 10, carbs_g: 18, fat_g: 4 },
  { id: "cookie", name: "soft cookie", emoji: "🍪", meal_slot: "treat", calories: 200, protein_g: 2, carbs_g: 28, fat_g: 9 },
  { id: "chocolate", name: "dark chocolate", emoji: "🍫", meal_slot: "treat", calories: 170, protein_g: 2, carbs_g: 14, fat_g: 12 },
  { id: "pizza-slice", name: "pizza slice", emoji: "🍕", meal_slot: "treat", calories: 285, protein_g: 12, carbs_g: 32, fat_g: 11 },
  { id: "eggs", name: "scrambled eggs", emoji: "🥚", meal_slot: "breakfast", calories: 220, protein_g: 14, carbs_g: 2, fat_g: 16 },
  { id: "smoothie", name: "berry smoothie", emoji: "🫐", meal_slot: "snack", calories: 210, protein_g: 6, carbs_g: 38, fat_g: 4 },
  { id: "paneer-bowl", name: "paneer bowl", emoji: "🧀", meal_slot: "dinner", calories: 480, protein_g: 22, carbs_g: 40, fat_g: 24 },
  { id: "idli", name: "idli plate", emoji: "🍽️", meal_slot: "breakfast", calories: 260, protein_g: 8, carbs_g: 48, fat_g: 4 },
];

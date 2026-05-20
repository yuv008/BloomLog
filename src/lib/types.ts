export type Mood =
  | "sunny"
  | "cozy"
  | "dreamy"
  | "rainy"
  | "sleepy"
  | "golden_hour"
  | "stormy";

export type ExpenseCategory =
  | "food"
  | "cafe"
  | "treats"
  | "travel"
  | "gifts"
  | "shopping";

export type FoodTag =
  | "healthy"
  | "homemade"
  | "comfort_food"
  | "protein_rich"
  | "fast_food";

export type RoomTheme = "windowsill" | "balcony" | "nook";

export type SleepQuality = "deep" | "okay" | "restless" | "stormy";

export type MealSlot =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "treat"
  | "cafe_drink";

export type FoodLogSource =
  | "quick"
  | "favorite"
  | "ai_estimate"
  | "recipe"
  | "polaroid";

export type CalorieDisplay = "hidden" | "soft" | "open";
export type MacroStyle = "balanced" | "protein_forward" | "gentle";

export interface UserProfile {
  id: string;
  display_name: string | null;
  cozy_hour: string;
  room_theme: RoomTheme;
  onboarding_complete: boolean;
  notifications_enabled: boolean;
  finance_enabled: boolean;
  currency: string;
  timezone: string;
  health_enabled?: boolean;
  soft_calorie_target?: number | null;
  water_goal_ml?: number;
  macro_style?: MacroStyle;
  calorie_display?: CalorieDisplay;
  health_onboarding_done?: boolean;
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  meal_slot: MealSlot;
  name: string;
  photo_url: string | null;
  emotional_tags: FoodTag[];
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  journal_note: string | null;
  source: FoodLogSource;
  source_meta: Record<string, unknown>;
  created_at: string;
}

export interface FoodFavorite {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  meal_slot: MealSlot;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
}

export interface AiRecipe {
  id: string;
  user_id: string;
  ingredients_hash: string;
  ingredients_raw: string;
  payload: AiRecipePayload;
  created_at: string;
}

export interface AiRecipePayload {
  title: string;
  cooking_time_min: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  steps: string[];
  substitutions?: string[];
  vibe_tags: string[];
  caution?: string;
}

export interface HealthInsight {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  kind: string;
  payload: Record<string, unknown>;
  source: "rule" | "ai";
  created_at: string;
}

export interface DailyNutritionSummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_count: number;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  date: string;
  mood: Mood | null;
  note: string | null;
  sleep_start: string | null;
  sleep_end: string | null;
  sleep_quality: SleepQuality | null;
  water_ml: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_time: string;
  photo_url: string | null;
  tags: FoodTag[];
}

export interface QuestCompletion {
  id: string;
  user_id: string;
  date: string;
  quest_key: string;
}

export interface GardenItem {
  id: string;
  user_id: string;
  item_key: string;
  acquired_at: string;
  position: { x: number; y: number; layer: number };
  bloom_stage: number;
}

export interface MemoryPolaroid {
  id: string;
  user_id: string;
  kind: string;
  period_start: string;
  period_end: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WhisperLog {
  id: string;
  user_id: string;
  whisper_key: string;
  shown_at: string;
}

export interface JournalLetter {
  id: string;
  user_id: string;
  body: string;
  mood_snapshot: Mood | null;
  created_at: string;
}

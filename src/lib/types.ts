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
  created_at: string;
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

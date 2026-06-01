/** Core domain types for the calorie tracker. */

export type Nutrition = {
  name: string;
  servingDesc: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  confidence?: number; // 0..1, AI recognition confidence
};

export type FoodEntry = Nutrition & {
  id: string;
  dateISO: string; // YYYY-MM-DD (local day the meal belongs to)
  createdAt: number; // epoch ms
  imageUri?: string;
  source: 'ai' | 'manual';
};

export type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

import type { FoodEntry } from './types';

/** Meal types, in display order. */
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_EMOJI: Record<MealType, string> = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎',
};

/** Derive a meal type from the time the entry was logged. */
export function mealTypeFor(createdAt: number): MealType {
  const h = new Date(createdAt).getHours();
  if (h >= 4 && h < 11) return 'Breakfast';
  if (h >= 11 && h < 16) return 'Lunch';
  if (h >= 16 && h < 22) return 'Dinner';
  return 'Snack';
}

export type MealGroup = { type: MealType; entries: FoodEntry[]; calories: number };

/** Group entries by meal type, preserving MEAL_TYPES order and dropping empties. */
export function groupByMeal(entries: FoodEntry[]): MealGroup[] {
  const byType = new Map<MealType, FoodEntry[]>();
  for (const e of entries) {
    const t = mealTypeFor(e.createdAt);
    (byType.get(t) ?? byType.set(t, []).get(t)!).push(e);
  }
  return MEAL_TYPES.filter((t) => byType.has(t)).map((t) => {
    const list = byType.get(t)!.sort((a, b) => b.createdAt - a.createdAt);
    return { type: t, entries: list, calories: list.reduce((s, e) => s + (e.calories || 0), 0) };
  });
}

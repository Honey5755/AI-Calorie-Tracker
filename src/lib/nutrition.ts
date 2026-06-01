/** Pure nutrition math — totals, remaining, ring geometry. */

import { macroMeta } from '@/theme';
import type { DayTotals, FoodEntry, Goals } from './types';

export const EMPTY_TOTALS: DayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumTotals(entries: FoodEntry[]): DayTotals {
  return entries.reduce<DayTotals>(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { ...EMPTY_TOTALS }
  );
}

export function remaining(totals: DayTotals, goals: Goals): DayTotals {
  return {
    calories: Math.max(0, goals.calories - totals.calories),
    protein: Math.max(0, goals.protein - totals.protein),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fat: Math.max(0, goals.fat - totals.fat),
  };
}

/** Fraction 0..1 (clamped) of goal consumed. */
export function progress(value: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(1, Math.max(0, value / goal));
}

/** Calories implied by a macro gram amount. */
export function macroCalories(grams: number, macro: keyof typeof macroMeta): number {
  return Math.round(grams * macroMeta[macro].kcalPerGram);
}

/** Calories implied by an entry's macros — used to sanity-check AI output. */
export function caloriesFromMacros(n: { protein: number; carbs: number; fat: number }): number {
  return Math.round(n.protein * 4 + n.carbs * 4 + n.fat * 9);
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round((n || 0) * f) / f;
}

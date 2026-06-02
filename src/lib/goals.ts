import type { Goals } from './types';

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type GoalKind = 'lose' | 'maintain' | 'gain';

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: GoalKind;
};

export const ACTIVITY_OPTIONS: { key: Activity; label: string; desc: string; factor: number }[] = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', factor: 1.2 },
  { key: 'light', label: 'Lightly active', desc: 'Exercise 1–3 days/week', factor: 1.375 },
  { key: 'moderate', label: 'Moderately active', desc: 'Exercise 3–5 days/week', factor: 1.55 },
  { key: 'active', label: 'Very active', desc: 'Exercise 6–7 days/week', factor: 1.725 },
  { key: 'veryActive', label: 'Athlete', desc: 'Hard daily training', factor: 1.9 },
];

export const GOAL_OPTIONS: { key: GoalKind; label: string; emoji: string; adjust: number }[] = [
  { key: 'lose', label: 'Lose weight', emoji: '📉', adjust: -500 },
  { key: 'maintain', label: 'Maintain', emoji: '⚖️', adjust: 0 },
  { key: 'gain', label: 'Gain muscle', emoji: '💪', adjust: 350 },
];

/** Mifflin–St Jeor basal metabolic rate (kcal/day). */
export function bmr(p: Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

/** Total daily energy expenditure (BMR × activity factor). */
export function tdee(p: Profile): number {
  const factor = ACTIVITY_OPTIONS.find((a) => a.key === p.activity)?.factor ?? 1.2;
  return bmr(p) * factor;
}

/** Compute calorie + macro targets from a profile. */
export function computeGoals(p: Profile): Goals {
  const adjust = GOAL_OPTIONS.find((g) => g.key === p.goal)?.adjust ?? 0;
  const calories = Math.max(1200, Math.round((tdee(p) + adjust) / 10) * 10);

  // Protein ~1.8 g/kg; fat ~25% of calories; carbs fill the rest.
  const protein = Math.round(p.weightKg * 1.8);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}

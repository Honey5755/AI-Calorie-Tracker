import { caloriesFromMacros } from '@/lib/nutrition';
import type { Nutrition } from '@/lib/types';

/**
 * Shared prompt, JSON schema, and response sanitizer used by every AI provider
 * (Gemini, Claude). Keeping this in one place means all providers return the
 * exact same validated `Nutrition` shape.
 */

export const NUTRITION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    servingDesc: { type: 'string' },
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'number' },
  },
  required: ['name', 'servingDesc', 'calories', 'protein', 'carbs', 'fat'],
  // NB: no `additionalProperties` here — Gemini's responseSchema rejects it.
  // Claude's structured-output schema adds it (see claude.ts).
} as const;

export const NUTRITION_PROMPT = `You are a nutrition expert. Analyze the food in this photo and estimate its nutrition for the portion visible.
Return ONLY JSON matching the schema:
- name: short dish name (e.g. "Grilled Chicken Salad")
- servingDesc: the portion you estimated (e.g. "1 plate (~350g)")
- calories: total kcal (integer)
- protein, carbs, fat: grams (integers)
- confidence: 0..1 how confident you are in the identification
Be realistic. If multiple foods are present, sum them and name the overall meal.`;

function clampNum(v: unknown, min = 0, max = 100000): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!isFinite(n)) return 0;
  return Math.round(Math.min(max, Math.max(min, n)));
}

/** Validate + clamp a raw model response into a safe Nutrition object. */
export function sanitizeNutrition(raw: any): Nutrition {
  const macros = {
    protein: clampNum(raw?.protein, 0, 500),
    carbs: clampNum(raw?.carbs, 0, 800),
    fat: clampNum(raw?.fat, 0, 400),
  };
  let calories = clampNum(raw?.calories, 0, 6000);
  // If the model's calorie number is wildly off from its macros, trust the macros.
  const fromMacros = caloriesFromMacros(macros);
  if (calories === 0 || Math.abs(calories - fromMacros) > Math.max(120, fromMacros * 0.6)) {
    calories = fromMacros || calories;
  }
  const confidence =
    typeof raw?.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.8;
  return {
    name: String(raw?.name || 'Food').slice(0, 60),
    servingDesc: String(raw?.servingDesc || '1 serving').slice(0, 60),
    calories,
    ...macros,
    confidence,
  };
}

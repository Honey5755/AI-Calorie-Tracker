import type { Nutrition } from '@/lib/types';

/**
 * Offline fallback used when no Gemini key is set (or a call fails) so the app
 * always works end-to-end for the demo. Returns a plausible, slightly randomized
 * result so repeated logging feels real.
 */

const SAMPLES: Nutrition[] = [
  { name: 'Grilled Chicken Salad', servingDesc: '1 plate (~350g)', calories: 430, protein: 38, carbs: 22, fat: 19 },
  { name: 'Margherita Pizza', servingDesc: '2 slices', calories: 580, protein: 24, carbs: 66, fat: 24 },
  { name: 'Salmon & Quinoa Bowl', servingDesc: '1 bowl', calories: 560, protein: 42, carbs: 45, fat: 22 },
  { name: 'Avocado Toast & Egg', servingDesc: '2 slices', calories: 360, protein: 15, carbs: 34, fat: 19 },
  { name: 'Beef Burger & Fries', servingDesc: '1 burger + fries', calories: 820, protein: 38, carbs: 72, fat: 42 },
  { name: 'Veggie Stir-fry', servingDesc: '1 bowl', calories: 410, protein: 16, carbs: 52, fat: 14 },
  { name: 'Pancakes & Berries', servingDesc: '3 pancakes', calories: 520, protein: 12, carbs: 78, fat: 16 },
  { name: 'Sushi Platter', servingDesc: '10 pieces', calories: 560, protein: 28, carbs: 80, fat: 12 },
  { name: 'Greek Yogurt & Granola', servingDesc: '1 bowl', calories: 300, protein: 20, carbs: 38, fat: 8 },
  { name: 'Chicken Burrito', servingDesc: '1 burrito', calories: 700, protein: 40, carbs: 72, fat: 26 },
];

function jitter(n: number, pct = 0.12): number {
  const delta = n * pct;
  return Math.round(n - delta + Math.random() * delta * 2);
}

export function mockAnalyze(): Nutrition {
  const base = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  return {
    name: base.name,
    servingDesc: base.servingDesc,
    calories: jitter(base.calories),
    protein: jitter(base.protein),
    carbs: jitter(base.carbs),
    fat: jitter(base.fat),
    confidence: 0.7 + Math.random() * 0.25,
  };
}

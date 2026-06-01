import { addDays, todayISO } from '@/lib/date';
import type { FoodEntry, Nutrition } from '@/lib/types';

/**
 * Demo data so the diary, charts, rings and streak look alive on first launch
 * (great for screenshots / the Loom demo). Cleared via Profile → Reset.
 */

type SeedMeal = Nutrition & { hourOffset: number };

const MEALS: Record<string, SeedMeal[]> = {
  // dayOffset 0 = today (partial day, leaves headroom on the rings)
  '0': [
    { name: 'Greek Yogurt & Berries', servingDesc: '1 bowl (250g)', calories: 220, protein: 18, carbs: 26, fat: 5, confidence: 0.94, hourOffset: 8 },
    { name: 'Grilled Chicken Salad', servingDesc: '1 plate', calories: 430, protein: 38, carbs: 22, fat: 19, confidence: 0.9, hourOffset: 13 },
  ],
  '1': [
    { name: 'Avocado Toast & Egg', servingDesc: '2 slices', calories: 360, protein: 15, carbs: 34, fat: 19, confidence: 0.88, hourOffset: 8 },
    { name: 'Salmon & Quinoa Bowl', servingDesc: '1 bowl', calories: 560, protein: 42, carbs: 45, fat: 22, confidence: 0.91, hourOffset: 13 },
    { name: 'Protein Smoothie', servingDesc: '1 glass (400ml)', calories: 280, protein: 30, carbs: 28, fat: 6, confidence: 0.86, hourOffset: 17 },
    { name: 'Spaghetti Bolognese', servingDesc: '1 plate', calories: 620, protein: 32, carbs: 70, fat: 22, confidence: 0.89, hourOffset: 20 },
  ],
  '2': [
    { name: 'Oatmeal & Banana', servingDesc: '1 bowl', calories: 320, protein: 11, carbs: 58, fat: 6, confidence: 0.92, hourOffset: 8 },
    { name: 'Turkey Sandwich', servingDesc: '1 sandwich', calories: 480, protein: 34, carbs: 46, fat: 16, confidence: 0.87, hourOffset: 12 },
    { name: 'Beef Stir-fry & Rice', servingDesc: '1 bowl', calories: 640, protein: 38, carbs: 68, fat: 22, confidence: 0.9, hourOffset: 19 },
  ],
  '3': [
    { name: 'Veggie Omelette', servingDesc: '3 eggs', calories: 340, protein: 24, carbs: 8, fat: 24, confidence: 0.91, hourOffset: 9 },
    { name: 'Poke Bowl', servingDesc: '1 bowl', calories: 520, protein: 36, carbs: 58, fat: 14, confidence: 0.88, hourOffset: 13 },
    { name: 'Margherita Pizza', servingDesc: '2 slices', calories: 580, protein: 24, carbs: 66, fat: 24, confidence: 0.85, hourOffset: 20 },
  ],
  '4': [
    { name: 'Pancakes & Maple Syrup', servingDesc: '3 pancakes', calories: 520, protein: 12, carbs: 78, fat: 16, confidence: 0.83, hourOffset: 9 },
    { name: 'Chicken Burrito', servingDesc: '1 burrito', calories: 700, protein: 40, carbs: 72, fat: 26, confidence: 0.89, hourOffset: 14 },
  ],
  '6': [
    { name: 'Egg & Bacon Muffin', servingDesc: '1 muffin', calories: 300, protein: 17, carbs: 26, fat: 14, confidence: 0.86, hourOffset: 8 },
    { name: 'Caesar Salad & Shrimp', servingDesc: '1 plate', calories: 420, protein: 30, carbs: 18, fat: 24, confidence: 0.9, hourOffset: 13 },
    { name: 'Sushi Platter', servingDesc: '10 pieces', calories: 560, protein: 28, carbs: 80, fat: 12, confidence: 0.88, hourOffset: 19 },
  ],
};

export function buildSeedEntries(makeId: () => string): FoodEntry[] {
  const out: FoodEntry[] = [];
  const today = todayISO();
  for (const [offsetStr, meals] of Object.entries(MEALS)) {
    const dateISO = addDays(today, -Number(offsetStr));
    const [y, m, d] = dateISO.split('-').map(Number);
    for (const meal of meals) {
      const { hourOffset, ...nutrition } = meal;
      const createdAt = new Date(y, m - 1, d, hourOffset, 0, 0).getTime();
      out.push({
        ...nutrition,
        id: makeId(),
        dateISO,
        createdAt,
        source: 'ai',
      });
    }
  }
  return out;
}

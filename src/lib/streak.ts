/** Streak = consecutive days (ending today or yesterday) with at least one logged meal. */

import { addDays, todayISO } from './date';
import type { FoodEntry } from './types';

export function loggedDays(entries: FoodEntry[]): Set<string> {
  return new Set(entries.map((e) => e.dateISO));
}

/**
 * Current streak length. Counts back from today; if nothing logged today yet but
 * yesterday has an entry, the streak is still considered alive (counts from yesterday).
 */
export function currentStreak(entries: FoodEntry[], todayOverride?: string): number {
  const today = todayOverride ?? todayISO();
  const days = loggedDays(entries);
  if (days.size === 0) return 0;

  // Start from today if logged, else yesterday (grace day) if logged, else 0.
  let cursor = today;
  if (!days.has(cursor)) {
    const yesterday = addDays(today, -1);
    if (!days.has(yesterday)) return 0;
    cursor = yesterday;
  }

  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Longest run of consecutive logged days in the history. */
export function longestStreak(entries: FoodEntry[]): number {
  const days = [...loggedDays(entries)].sort();
  if (days.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (addDays(days[i - 1], 1) === days[i]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

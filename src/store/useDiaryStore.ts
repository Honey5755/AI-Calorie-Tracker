import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addDays, todayISO } from '@/lib/date';
import { sumTotals } from '@/lib/nutrition';
import type { DayTotals, FoodEntry, Goals, Nutrition } from '@/lib/types';
import { buildSeedEntries } from './seed';

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type DiaryState = {
  entries: FoodEntry[];
  goals: Goals;
  hydrated: boolean;
  seeded: boolean;

  // actions
  addEntry: (n: Nutrition, opts?: { dateISO?: string; imageUri?: string; source?: 'ai' | 'manual' }) => FoodEntry;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<Nutrition>) => void;
  setGoals: (g: Partial<Goals>) => void;
  resetAll: () => void;
  seedIfEmpty: () => void;

  // selectors
  entriesForDate: (dateISO: string) => FoodEntry[];
  totalsForDate: (dateISO: string) => DayTotals;
};

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      goals: DEFAULT_GOALS,
      hydrated: false,
      seeded: false,

      addEntry: (n, opts) => {
        const entry: FoodEntry = {
          ...n,
          id: makeId(),
          dateISO: opts?.dateISO ?? todayISO(),
          createdAt: Date.now(),
          imageUri: opts?.imageUri,
          source: opts?.source ?? 'ai',
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
        return entry;
      },

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      setGoals: (g) => set((s) => ({ goals: { ...s.goals, ...g } })),

      resetAll: () => set({ entries: [], goals: DEFAULT_GOALS, seeded: true }),

      seedIfEmpty: () => {
        const { entries, seeded } = get();
        if (seeded || entries.length > 0) {
          if (!seeded) set({ seeded: true });
          return;
        }
        set({ entries: buildSeedEntries(makeId), seeded: true });
      },

      entriesForDate: (dateISO) =>
        get()
          .entries.filter((e) => e.dateISO === dateISO)
          .sort((a, b) => b.createdAt - a.createdAt),

      totalsForDate: (dateISO) => sumTotals(get().entries.filter((e) => e.dateISO === dateISO)),
    }),
    {
      name: 'nutrisnap-diary-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries, goals: s.goals, seeded: s.seeded }),
      onRehydrateStorage: () => (state) => {
        // Mark hydrated and seed demo data on very first launch.
        state?.seedIfEmpty();
        useDiaryStore.setState({ hydrated: true });
      },
    }
  )
);

// Convenience selector hooks
export const useGoals = () => useDiaryStore((s) => s.goals);
export const useHydrated = () => useDiaryStore((s) => s.hydrated);

export { addDays };

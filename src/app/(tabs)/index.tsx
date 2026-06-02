import { useMemo } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Card, SectionLabel } from '@/components/Card';
import { CalorieRing } from '@/components/CalorieRing';
import { EmptyState } from '@/components/EmptyState';
import { MacroRings } from '@/components/MacroRings';
import { MealCard } from '@/components/MealCard';
import { Screen } from '@/components/Screen';
import { StreakBadge } from '@/components/StreakBadge';
import { relativeDayLabel, todayISO } from '@/lib/date';
import { groupByMeal, MEAL_EMOJI } from '@/lib/meals';
import { sumTotals } from '@/lib/nutrition';
import { currentStreak } from '@/lib/streak';
import { colors, font, spacing } from '@/theme';
import { useDiaryStore } from '@/store/useDiaryStore';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DiaryScreen() {
  const hydrated = useDiaryStore((s) => s.hydrated);
  const entries = useDiaryStore((s) => s.entries);
  const goals = useDiaryStore((s) => s.goals);
  const removeEntry = useDiaryStore((s) => s.removeEntry);

  const today = todayISO();
  const todays = useMemo(
    () => entries.filter((e) => e.dateISO === today).sort((a, b) => b.createdAt - a.createdAt),
    [entries, today]
  );
  const totals = useMemo(() => sumTotals(todays), [todays]);
  const groups = useMemo(() => groupByMeal(todays), [todays]);
  const streak = useMemo(() => currentStreak(entries), [entries]);

  const confirmDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      // Alert has no buttons on web; delete directly.
      removeEntry(id);
      return;
    }
    Alert.alert('Remove meal?', `Delete "${name}" from today's diary.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  if (!hydrated) {
    return (
      <Screen scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.date}>{relativeDayLabel(today)}</Text>
        </View>
        <StreakBadge days={streak} compact />
      </View>

      <Card style={styles.hero}>
        <CalorieRing consumed={Math.round(totals.calories)} goal={goals.calories} />
        <View style={styles.macroWrap}>
          <MacroRings totals={totals} goals={goals} />
        </View>
      </Card>

      <View style={styles.meals}>
        <SectionLabel right={<Text style={styles.count}>{todays.length} logged</Text>}>
          Today’s meals
        </SectionLabel>

        {todays.length === 0 ? (
          <EmptyState
            emoji="📸"
            title="No meals yet"
            subtitle="Tap the camera button to snap your food and let AI log the macros."
          />
        ) : (
          <View style={{ gap: spacing.lg }}>
            {groups.map((g) => (
              <View key={g.type} style={{ gap: spacing.sm }}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTitle}>
                    {MEAL_EMOJI[g.type]}  {g.type}
                  </Text>
                  <Text style={styles.mealKcal}>{Math.round(g.calories)} kcal</Text>
                </View>
                {g.entries.map((e) => (
                  <MealCard key={e.id} entry={e} onLongPress={() => confirmDelete(e.id, e.name)} />
                ))}
              </View>
            ))}
            <Text style={styles.hint}>Tip: long-press a meal to remove it.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: { color: colors.textDim, fontSize: font.size.md, fontWeight: '600' },
  date: { color: colors.text, fontSize: font.size.xl, fontWeight: '800', marginTop: 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  macroWrap: { marginTop: spacing.xl, alignSelf: 'stretch' },
  meals: { marginTop: spacing.xl },
  count: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  mealTitle: { color: colors.text, fontSize: font.size.md, fontWeight: '700' },
  mealKcal: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },
  hint: { color: colors.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: 4 },
});

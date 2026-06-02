import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalorieRing } from '@/components/CalorieRing';
import { Card, SectionLabel } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MacroRings } from '@/components/MacroRings';
import { MealCard } from '@/components/MealCard';
import { Screen } from '@/components/Screen';
import { relativeDayLabel } from '@/lib/date';
import { groupByMeal, MEAL_EMOJI } from '@/lib/meals';
import { sumTotals } from '@/lib/nutrition';
import { colors, font, spacing } from '@/theme';
import { useDiaryStore } from '@/store/useDiaryStore';

export default function DayDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateISO = String(date);

  const entries = useDiaryStore((s) => s.entries);
  const goals = useDiaryStore((s) => s.goals);

  const days = useMemo(
    () => entries.filter((e) => e.dateISO === dateISO).sort((a, b) => b.createdAt - a.createdAt),
    [entries, dateISO]
  );
  const totals = useMemo(() => sumTotals(days), [days]);
  const groups = useMemo(() => groupByMeal(days), [days]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={close} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{relativeDayLabel(dateISO)}</Text>
        <View style={{ width: 36 }} />
      </View>

      <Card style={styles.hero}>
        <CalorieRing consumed={Math.round(totals.calories)} goal={goals.calories} size={190} />
        <View style={styles.macroWrap}>
          <MacroRings totals={totals} goals={goals} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <SectionLabel right={<Text style={styles.count}>{days.length} logged</Text>}>Meals</SectionLabel>
        {days.length === 0 ? (
          <EmptyState emoji="🍽️" title="Nothing logged" subtitle="No meals were recorded on this day." />
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
                  <MealCard key={e.id} entry={e} />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  macroWrap: { marginTop: spacing.xl, alignSelf: 'stretch' },
  count: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  mealTitle: { color: colors.text, fontSize: font.size.md, fontWeight: '700' },
  mealKcal: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },
});

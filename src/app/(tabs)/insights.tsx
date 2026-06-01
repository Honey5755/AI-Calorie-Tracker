import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, SectionLabel } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { StreakBadge } from '@/components/StreakBadge';
import { WeeklyBarChart, type DayDatum } from '@/components/WeeklyBarChart';
import { lastNDays } from '@/lib/date';
import { sumTotals } from '@/lib/nutrition';
import { currentStreak, longestStreak } from '@/lib/streak';
import { colors, font, macroMeta, spacing } from '@/theme';
import { useDiaryStore } from '@/store/useDiaryStore';

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const entries = useDiaryStore((s) => s.entries);
  const goals = useDiaryStore((s) => s.goals);

  const days = useMemo(() => lastNDays(7), []);

  const { chartData, avgCalories, daysOnTrack, avgMacros, loggedCount } = useMemo(() => {
    const byDay = new Map<string, ReturnType<typeof sumTotals>>();
    for (const d of days) {
      byDay.set(
        d,
        sumTotals(entries.filter((e) => e.dateISO === d))
      );
    }
    const chart: DayDatum[] = days.map((d) => ({ dateISO: d, calories: Math.round(byDay.get(d)!.calories) }));

    const logged = days.filter((d) => byDay.get(d)!.calories > 0);
    const sum = logged.reduce(
      (acc, d) => {
        const t = byDay.get(d)!;
        return {
          calories: acc.calories + t.calories,
          protein: acc.protein + t.protein,
          carbs: acc.carbs + t.carbs,
          fat: acc.fat + t.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    const n = Math.max(1, logged.length);
    const onTrack = logged.filter((d) => byDay.get(d)!.calories <= goals.calories * 1.05).length;

    return {
      chartData: chart,
      avgCalories: Math.round(sum.calories / n),
      daysOnTrack: onTrack,
      loggedCount: logged.length,
      avgMacros: {
        protein: Math.round(sum.protein / n),
        carbs: Math.round(sum.carbs / n),
        fat: Math.round(sum.fat / n),
      },
    };
  }, [entries, days, goals.calories]);

  const streak = currentStreak(entries);
  const best = longestStreak(entries);

  return (
    <Screen>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Your last 7 days</Text>

      <StreakBadge days={streak} />

      <Card style={styles.section}>
        <SectionLabel right={<Text style={styles.goalTag}>Goal {goals.calories.toLocaleString()}</Text>}>
          Calories
        </SectionLabel>
        <WeeklyBarChart data={chartData} goal={goals.calories} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Stat label="Avg / day" value={`${avgCalories.toLocaleString()}`} accent={colors.brand} />
        </Card>
        <Card style={styles.statCard}>
          <Stat label="Days on track" value={`${daysOnTrack}/${loggedCount || 0}`} />
        </Card>
        <Card style={styles.statCard}>
          <Stat label="Best streak" value={`${best}`} accent={colors.warning} />
        </Card>
      </View>

      <Card style={styles.section}>
        <SectionLabel>Avg macros / day</SectionLabel>
        <View style={styles.macroRow}>
          {(['protein', 'carbs', 'fat'] as const).map((m) => (
            <View key={m} style={styles.macroItem}>
              <View style={[styles.macroBarTrack]}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      backgroundColor: macroMeta[m].color,
                      width: `${Math.min(100, (avgMacros[m] / Math.max(1, goals[m])) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroVal}>{avgMacros[m]}g</Text>
              <Text style={styles.macroLbl}>{macroMeta[m].label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.size.xxl, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: font.size.md, marginTop: 2, marginBottom: spacing.lg },
  section: { marginTop: spacing.lg },
  goalTag: { color: colors.textFaint, fontSize: font.size.xs, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statCard: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm },
  stat: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: font.size.xl, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: font.size.xs, marginTop: 4, textAlign: 'center' },
  macroRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  macroItem: { flex: 1, alignItems: 'center' },
  macroBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.track,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroBarFill: { height: '100%', borderRadius: 4 },
  macroVal: { color: colors.text, fontSize: font.size.md, fontWeight: '800' },
  macroLbl: { color: colors.textDim, fontSize: font.size.xs, marginTop: 2 },
});

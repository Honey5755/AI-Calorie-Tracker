import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, todayISO } from '@/lib/date';
import { colors, font, radius } from '@/theme';

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** GitHub-style calendar heatmap of the last `weeks` weeks, colored by calories. */
export function StreakHeatmap({
  caloriesByDay,
  goal,
  weeks = 6,
  onPressDay,
}: {
  caloriesByDay: Map<string, number>;
  goal: number;
  weeks?: number;
  onPressDay?: (dateISO: string) => void;
}) {
  const today = todayISO();
  const [ty, tm, td] = today.split('-').map(Number);
  const todayWeekday = new Date(ty, tm - 1, td).getDay(); // 0=Sun
  // Sunday that starts the current week:
  const currentSunday = addDays(today, -todayWeekday);
  const gridStart = addDays(currentSunday, -(weeks - 1) * 7);

  const rows: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: string[] = [];
    for (let d = 0; d < 7; d++) row.push(addDays(gridStart, w * 7 + d));
    rows.push(row);
  }

  const cellColor = (dateISO: string) => {
    if (dateISO > today) return 'transparent'; // future
    const cal = caloriesByDay.get(dateISO) ?? 0;
    if (cal <= 0) return colors.track;
    const frac = Math.min(1, cal / Math.max(1, goal));
    // brand with intensity ramp
    const alpha = 0.4 + 0.6 * frac;
    return withAlpha(colors.brand, alpha);
  };

  return (
    <View>
      <View style={styles.weekHeader}>
        {WEEKDAY_LETTERS.map((l, i) => (
          <Text key={i} style={styles.weekday}>
            {l}
          </Text>
        ))}
      </View>
      {rows.map((row, w) => (
        <View key={w} style={styles.row}>
          {row.map((dateISO) => {
            const future = dateISO > today;
            return (
              <Pressable
                key={dateISO}
                disabled={future || !onPressDay}
                onPress={() => onPressDay?.(dateISO)}
                style={({ pressed }) => [
                  styles.cell,
                  { backgroundColor: cellColor(dateISO) },
                  future && styles.future,
                  dateISO === today && styles.todayCell,
                  pressed && !future && { opacity: 0.6 },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: font.size.xs, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  future: { borderColor: 'transparent' },
  todayCell: { borderColor: colors.brand, borderWidth: 2 },
});

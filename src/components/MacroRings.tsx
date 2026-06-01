import { StyleSheet, Text, View } from 'react-native';

import { progress } from '@/lib/nutrition';
import type { DayTotals, Goals } from '@/lib/types';
import { colors, font, macroMeta, type MacroKey } from '@/theme';
import { ProgressRing } from './ProgressRing';

function MacroRing({ macro, value, goal }: { macro: MacroKey; value: number; goal: number }) {
  const meta = macroMeta[macro];
  return (
    <View style={styles.item}>
      <ProgressRing size={78} strokeWidth={8} progress={progress(value, goal)} color={meta.color}>
        <Text style={styles.value}>{Math.round(value)}</Text>
        <Text style={styles.unit}>/{goal}g</Text>
      </ProgressRing>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
        <Text style={styles.label}>{meta.label}</Text>
      </View>
    </View>
  );
}

/** Row of three macro progress rings (protein / carbs / fat). */
export function MacroRings({ totals, goals }: { totals: DayTotals; goals: Goals }) {
  return (
    <View style={styles.row}>
      <MacroRing macro="protein" value={totals.protein} goal={goals.protein} />
      <MacroRing macro="carbs" value={totals.carbs} goal={goals.carbs} />
      <MacroRing macro="fat" value={totals.fat} goal={goals.fat} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: { alignItems: 'center' },
  value: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  unit: { color: colors.textFaint, fontSize: font.size.xs, fontWeight: '600', marginTop: -2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.textDim, fontSize: font.size.sm, fontWeight: '600' },
});

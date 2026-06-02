import { StyleSheet, Text, View } from 'react-native';

import { progress } from '@/lib/nutrition';
import { useCountUp } from '@/lib/useCountUp';
import { colors, font } from '@/theme';
import { ProgressRing } from './ProgressRing';

type Props = {
  consumed: number;
  goal: number;
  size?: number;
};

/** Big hero ring: calories remaining vs goal. */
export function CalorieRing({ consumed, goal, size = 220 }: Props) {
  const over = consumed > goal;
  const remaining = useCountUp(Math.max(0, goal - consumed));
  const pct = progress(consumed, goal);
  const ringColor = over ? colors.danger : colors.brand;

  return (
    <ProgressRing size={size} strokeWidth={18} progress={pct} color={ringColor}>
      <View style={styles.center}>
        <Text style={styles.big}>{remaining.toLocaleString()}</Text>
        <Text style={styles.label}>{over ? 'calories over' : 'calories left'}</Text>
        <View style={styles.consumedRow}>
          <Text style={styles.consumed}>{consumed.toLocaleString()}</Text>
          <Text style={styles.consumedDim}> / {goal.toLocaleString()} kcal</Text>
        </View>
      </View>
    </ProgressRing>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  big: {
    color: colors.text,
    fontSize: font.size.display,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    color: colors.textDim,
    fontSize: font.size.md,
    fontWeight: '600',
    marginTop: 2,
  },
  consumedRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  consumed: { color: colors.text, fontSize: font.size.sm, fontWeight: '700' },
  consumedDim: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '500' },
});

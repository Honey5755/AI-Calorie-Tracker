import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

export function StreakBadge({ days, compact }: { days: number; compact?: boolean }) {
  const active = days > 0;
  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.flame}>{active ? '🔥' : '✨'}</Text>
        <Text style={styles.compactText}>{days}</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.bigFlame}>{active ? '🔥' : '✨'}</Text>
      <View>
        <Text style={styles.count}>
          {days} day{days === 1 ? '' : 's'}
        </Text>
        <Text style={styles.sub}>{active ? 'Current streak' : 'Log a meal to start'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  bigFlame: { fontSize: 34 },
  count: { color: colors.text, fontSize: font.size.xl, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: font.size.sm, marginTop: 2 },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flame: { fontSize: 16 },
  compactText: { color: colors.text, fontSize: font.size.md, fontWeight: '800' },
});

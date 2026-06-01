import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

export function EmptyState({
  emoji = '🍎',
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: font.size.lg, fontWeight: '700' },
  subtitle: {
    color: colors.textDim,
    fontSize: font.size.sm,
    marginTop: 4,
    textAlign: 'center',
  },
});

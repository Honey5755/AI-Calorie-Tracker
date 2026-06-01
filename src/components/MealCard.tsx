import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FoodEntry } from '@/lib/types';
import { colors, font, macroMeta, radius, spacing } from '@/theme';

function MacroChip({ macro, grams }: { macro: keyof typeof macroMeta; grams: number }) {
  const meta = macroMeta[macro];
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: meta.color }]} />
      <Text style={styles.chipText}>
        {Math.round(grams)}g {meta.label.charAt(0)}
      </Text>
    </View>
  );
}

const FOOD_EMOJI = '🍽️';

export function MealCard({
  entry,
  onPress,
  onLongPress,
}: {
  entry: FoodEntry;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const time = new Date(entry.createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        {entry.imageUri ? (
          <Image source={{ uri: entry.imageUri }} style={styles.thumbImg} contentFit="cover" />
        ) : (
          <Text style={styles.thumbEmoji}>{FOOD_EMOJI}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={styles.kcal}>{Math.round(entry.calories)}</Text>
        </View>
        <Text style={styles.serving} numberOfLines={1}>
          {entry.servingDesc} · {time}
        </Text>
        <View style={styles.chips}>
          <MacroChip macro="protein" grams={entry.protein} />
          <MacroChip macro="carbs" grams={entry.carbs} />
          <MacroChip macro="fat" grams={entry.fat} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 26 },
  body: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: font.size.md, fontWeight: '700', flex: 1, marginRight: 8 },
  kcal: { color: colors.brand, fontSize: font.size.md, fontWeight: '800' },
  serving: { color: colors.textFaint, fontSize: font.size.xs, marginTop: 2, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { color: colors.textDim, fontSize: font.size.xs, fontWeight: '600' },
});

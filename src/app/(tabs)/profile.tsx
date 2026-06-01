import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, SectionLabel } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { caloriesFromMacros } from '@/lib/nutrition';
import { aiStatusLabel, isAIConfigured } from '@/services/ai';
import { colors, font, macroMeta, radius, spacing, type MacroKey } from '@/theme';
import { DEFAULT_GOALS, useDiaryStore } from '@/store/useDiaryStore';

function Stepper({
  label,
  value,
  unit,
  step,
  color,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLabelWrap}>
        {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
        <Text style={styles.stepLabel}>{label}</Text>
      </View>
      <View style={styles.stepControls}>
        <Pressable
          onPress={() => onChange(Math.max(0, value - step))}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.stepValue}>
          {value}
          <Text style={styles.stepUnit}> {unit}</Text>
        </Text>
        <Pressable
          onPress={() => onChange(value + step)}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const goals = useDiaryStore((s) => s.goals);
  const setGoals = useDiaryStore((s) => s.setGoals);
  const resetAll = useDiaryStore((s) => s.resetAll);

  const macroKcal = caloriesFromMacros(goals);
  const live = isAIConfigured();

  const doReset = () => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && !window.confirm('Reset all meals and goals?')) return;
      resetAll();
      return;
    }
    Alert.alert('Reset everything?', 'This clears all logged meals and restores default goals.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Daily goals & settings</Text>

      <Card style={styles.section}>
        <SectionLabel>Daily targets</SectionLabel>
        <Stepper
          label="Calories"
          value={goals.calories}
          unit="kcal"
          step={50}
          color={colors.brand}
          onChange={(v) => setGoals({ calories: v })}
        />
        {(['protein', 'carbs', 'fat'] as MacroKey[]).map((m) => (
          <Stepper
            key={m}
            label={macroMeta[m].label}
            value={goals[m]}
            unit="g"
            step={5}
            color={macroMeta[m].color}
            onChange={(v) => setGoals({ [m]: v } as any)}
          />
        ))}
        <View style={styles.sanity}>
          <Text style={styles.sanityText}>
            Macros add up to{' '}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{macroKcal.toLocaleString()} kcal</Text>
            {'  '}vs goal {goals.calories.toLocaleString()}
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <SectionLabel>AI engine</SectionLabel>
        <View style={styles.aiRow}>
          <View style={[styles.aiDot, { backgroundColor: live ? colors.brand : colors.warning }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiStatus}>{aiStatusLabel()}</Text>
            <Text style={styles.aiHint}>
              {live
                ? 'Photos are analyzed by Google Gemini Vision.'
                : 'Add EXPO_PUBLIC_GEMINI_API_KEY to .env for live recognition. Mock data is used meanwhile.'}
            </Text>
          </View>
        </View>
      </Card>

      <Pressable onPress={() => setGoals(DEFAULT_GOALS)} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.6 }]}>
        <Ionicons name="refresh" size={16} color={colors.textDim} />
        <Text style={styles.linkText}>Restore default goals</Text>
      </Pressable>

      <Pressable onPress={doReset} style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.7 }]}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.dangerText}>Reset all data</Text>
      </Pressable>

      <Text style={styles.footer}>NutriSnap · AI Calorie Tracker</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.size.xxl, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: font.size.md, marginTop: 2, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stepLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepLabel: { color: colors.text, fontSize: font.size.md, fontWeight: '600' },
  stepControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: { backgroundColor: colors.surfaceElevated },
  stepValue: { color: colors.text, fontSize: font.size.md, fontWeight: '800', minWidth: 78, textAlign: 'center' },
  stepUnit: { color: colors.textFaint, fontSize: font.size.xs, fontWeight: '600' },
  sanity: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  sanityText: { color: colors.textDim, fontSize: font.size.sm },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  aiDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  aiStatus: { color: colors.text, fontSize: font.size.md, fontWeight: '700' },
  aiHint: { color: colors.textDim, fontSize: font.size.sm, marginTop: 2, lineHeight: 18 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  linkText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: '600' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  dangerText: { color: colors.danger, fontSize: font.size.sm, fontWeight: '700' },
  footer: { color: colors.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.xl },
});

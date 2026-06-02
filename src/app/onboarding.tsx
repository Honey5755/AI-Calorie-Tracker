import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowBackdrop } from '@/components/GlowBackdrop';
import { GradientButton } from '@/components/GradientButton';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, computeGoals, type Activity, type GoalKind, type Profile, type Sex } from '@/lib/goals';
import { macroMeta } from '@/theme';
import { colors, font, radius, spacing } from '@/theme';
import { useDiaryStore } from '@/store/useDiaryStore';

const STEPS = ['Sex', 'About you', 'Activity', 'Goal', 'Targets'] as const;

const DEFAULT: Profile = {
  sex: 'male',
  age: 25,
  heightCm: 175,
  weightKg: 70,
  activity: 'moderate',
  goal: 'maintain',
};

function OptionCard({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useDiaryStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(DEFAULT);

  const goals = useMemo(() => computeGoals(p), [p]);
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    completeOnboarding(p);
    router.replace('/');
  };
  const next = () => (isLast ? finish() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const setNum = (key: 'age' | 'heightCm' | 'weightKg', text: string, max: number) => {
    const n = Math.min(max, Math.max(0, parseInt(text.replace(/[^0-9]/g, '') || '0', 10)));
    setP((prev) => ({ ...prev, [key]: n }));
  };

  const { width } = useWindowDimensions();
  const colWidth = Math.min(width, 460);

  // Fade + slide each step in.
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step, anim]);
  const stepAnim = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <GlowBackdrop />
      <View style={[styles.column, { width: colWidth, paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Pressable onPress={back} disabled={step === 0} hitSlop={12} style={styles.headerBtn}>
          {step > 0 && <Ionicons name="chevron-back" size={22} color={colors.text} />}
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Pressable onPress={finish} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <Animated.View style={[styles.body, stepAnim]}>
        {step === 0 && (
          <Stage title="What's your sex?" subtitle="Used to estimate your metabolism.">
            <View style={styles.rowGap}>
              {(['male', 'female'] as Sex[]).map((s) => (
                <OptionCard key={s} active={p.sex === s} onPress={() => setP({ ...p, sex: s })}>
                  <Text style={styles.bigEmoji}>{s === 'male' ? '👨' : '👩'}</Text>
                  <Text style={styles.optionLabel}>{s === 'male' ? 'Male' : 'Female'}</Text>
                </OptionCard>
              ))}
            </View>
          </Stage>
        )}

        {step === 1 && (
          <Stage title="About you" subtitle="A few numbers to personalize your targets.">
            <NumberField label="Age" unit="years" value={p.age} onChangeText={(t) => setNum('age', t, 100)} />
            <NumberField label="Height" unit="cm" value={p.heightCm} onChangeText={(t) => setNum('heightCm', t, 250)} />
            <NumberField label="Weight" unit="kg" value={p.weightKg} onChangeText={(t) => setNum('weightKg', t, 300)} />
          </Stage>
        )}

        {step === 2 && (
          <Stage title="How active are you?" subtitle="Include workouts and daily movement.">
            <View style={{ gap: spacing.sm }}>
              {ACTIVITY_OPTIONS.map((a) => (
                <OptionCard key={a.key} active={p.activity === a.key} onPress={() => setP({ ...p, activity: a.key as Activity })}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionLabel}>{a.label}</Text>
                    <Text style={styles.optionDesc}>{a.desc}</Text>
                  </View>
                  {p.activity === a.key && <Ionicons name="checkmark-circle" size={22} color={colors.brand} />}
                </OptionCard>
              ))}
            </View>
          </Stage>
        )}

        {step === 3 && (
          <Stage title="What's your goal?" subtitle="We'll adjust your calorie target.">
            <View style={{ gap: spacing.sm }}>
              {GOAL_OPTIONS.map((g) => (
                <OptionCard key={g.key} active={p.goal === g.key} onPress={() => setP({ ...p, goal: g.key as GoalKind })}>
                  <Text style={styles.bigEmoji}>{g.emoji}</Text>
                  <Text style={[styles.optionLabel, { flex: 1 }]}>{g.label}</Text>
                  {p.goal === g.key && <Ionicons name="checkmark-circle" size={22} color={colors.brand} />}
                </OptionCard>
              ))}
            </View>
          </Stage>
        )}

        {step === 4 && (
          <Stage title="Your daily targets" subtitle="Calculated with the Mifflin–St Jeor formula. Edit anytime in Profile.">
            <View style={styles.targetCard}>
              <Text style={styles.targetCals}>{goals.calories.toLocaleString()}</Text>
              <Text style={styles.targetCalsLbl}>calories / day</Text>
              <View style={styles.macroRow}>
                {(['protein', 'carbs', 'fat'] as const).map((m) => (
                  <View key={m} style={styles.macroCol}>
                    <View style={[styles.macroDot, { backgroundColor: macroMeta[m].color }]} />
                    <Text style={styles.macroVal}>{goals[m]}g</Text>
                    <Text style={styles.macroLbl}>{macroMeta[m].label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Stage>
        )}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <GradientButton
          label={isLast ? 'Start tracking' : 'Continue'}
          icon={isLast ? 'checkmark' : 'arrow-forward'}
          onPress={next}
        />
      </View>
      </View>
    </View>
  );
}

function Stage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChangeText,
}: {
  label: string;
  unit: string;
  value: number;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.numRow}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numInputWrap}>
        <TextInput
          value={String(value)}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          style={styles.numInput}
          selectTextOnFocus
        />
        <Text style={styles.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  column: { flex: 1, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
  headerBtn: { width: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { color: colors.textDim, fontSize: font.size.sm, fontWeight: '600' },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: 3 },
  body: { flex: 1 },

  title: { color: colors.text, fontSize: font.size.xxl, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: font.size.md, marginTop: 6, lineHeight: 20 },

  rowGap: { flexDirection: 'row', gap: spacing.md },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.surfaceAlt },
  bigEmoji: { fontSize: 26 },
  optionLabel: { color: colors.text, fontSize: font.size.md, fontWeight: '700' },
  optionDesc: { color: colors.textDim, fontSize: font.size.sm, marginTop: 2 },

  numRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  numLabel: { color: colors.text, fontSize: font.size.md, fontWeight: '600' },
  numInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minWidth: 130,
    justifyContent: 'flex-end',
  },
  numInput: { color: colors.text, fontSize: font.size.lg, fontWeight: '800', paddingVertical: 12, minWidth: 50, textAlign: 'right' },
  numUnit: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },

  targetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  targetCals: { color: colors.brand, fontSize: font.size.display, fontWeight: '800', letterSpacing: -1 },
  targetCalsLbl: { color: colors.textDim, fontSize: font.size.md, fontWeight: '600', marginTop: -2 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: spacing.xl },
  macroCol: { alignItems: 'center', gap: 4 },
  macroDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  macroVal: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  macroLbl: { color: colors.textDim, fontSize: font.size.xs },

  footer: { paddingTop: spacing.md },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  ctaText: { color: colors.black, fontSize: font.size.md, fontWeight: '800' },
});

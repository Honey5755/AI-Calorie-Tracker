import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analyzeFoodImage, aiStatusLabel } from '@/services/ai';
import type { Nutrition } from '@/lib/types';
import { caloriesFromMacros } from '@/lib/nutrition';
import { colors, font, macroMeta, radius, spacing, type MacroKey } from '@/theme';
import { useDiaryStore } from '@/store/useDiaryStore';

type Stage = 'pick' | 'analyzing' | 'review';

const EMPTY: Nutrition = { name: '', servingDesc: '1 serving', calories: 0, protein: 0, carbs: 0, fat: 0 };

function haptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

export default function AddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addEntry = useDiaryStore((s) => s.addEntry);

  const [stage, setStage] = useState<Stage>('pick');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [form, setForm] = useState<Nutrition>(EMPTY);
  const [usedAI, setUsedAI] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>();

  const pick = async (mode: 'camera' | 'library') => {
    try {
      if (mode === 'camera' && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images',
        quality: 0.6,
        base64: true,
      };
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setImageUri(asset.uri);
      runAnalysis(asset.base64 ?? '', asset.mimeType ?? 'image/jpeg');
    } catch {
      // ignore — user can retry or enter manually
    }
  };

  const runAnalysis = async (base64: string, mimeType: string) => {
    setStage('analyzing');
    setAiError(undefined);
    const res = await analyzeFoodImage(base64, mimeType);
    setForm(res.nutrition);
    setUsedAI(res.usedAI);
    setAiError(res.error);
    setStage('review');
    haptic(Haptics.ImpactFeedbackStyle.Light);
  };

  const startManual = () => {
    setImageUri(undefined);
    setForm({ ...EMPTY, name: '' });
    setUsedAI(false);
    setStage('review');
  };

  const save = () => {
    const name = form.name.trim() || 'Food';
    addEntry({ ...form, name }, { imageUri, source: usedAI ? 'ai' : 'manual' });
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const setMacro = (m: MacroKey, v: number) => {
    setForm((f) => {
      const next = { ...f, [m]: Math.max(0, v) };
      // keep calories roughly in sync with macros as the user edits
      return { ...next, calories: caloriesFromMacros(next) };
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>
          {stage === 'review' ? 'Review meal' : 'Add food'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}>
        {stage === 'pick' && <PickStage onPick={pick} onManual={startManual} />}

        {stage === 'analyzing' && (
          <View style={styles.analyzing}>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewBig} contentFit="cover" /> : null}
            <View style={styles.analyzeBadge}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.analyzeText}>Analyzing your meal…</Text>
              <Text style={styles.analyzeSub}>{aiStatusLabel()}</Text>
            </View>
          </View>
        )}

        {stage === 'review' && (
          <ReviewStage
            form={form}
            imageUri={imageUri}
            usedAI={usedAI}
            aiError={aiError}
            onChangeText={(patch) => setForm((f) => ({ ...f, ...patch }))}
            onChangeCalories={(v) => setForm((f) => ({ ...f, calories: Math.max(0, v) }))}
            onChangeMacro={setMacro}
          />
        )}
      </ScrollView>

      {stage === 'review' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={save} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="checkmark" size={20} color={colors.black} />
            <Text style={styles.saveText}>Add to diary</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function PickStage({
  onPick,
  onManual,
}: {
  onPick: (m: 'camera' | 'library') => void;
  onManual: () => void;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🍱</Text>
        <Text style={styles.heroTitle}>Snap or upload your meal</Text>
        <Text style={styles.heroSub}>AI identifies the food and estimates calories, protein, carbs & fat.</Text>
      </View>

      {Platform.OS !== 'web' && (
        <Pressable onPress={() => onPick('camera')} style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }]}>
          <Ionicons name="camera" size={22} color={colors.black} />
          <Text style={styles.primaryActionText}>Take a photo</Text>
        </Pressable>
      )}

      <Pressable onPress={() => onPick('library')} style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.8 }]}>
        <Ionicons name="image" size={22} color={colors.brand} />
        <Text style={styles.secondaryActionText}>
          {Platform.OS === 'web' ? 'Choose a food photo' : 'Choose from library'}
        </Text>
      </Pressable>

      <Pressable onPress={onManual} style={({ pressed }) => [styles.ghostAction, pressed && { opacity: 0.6 }]}>
        <Ionicons name="create-outline" size={18} color={colors.textDim} />
        <Text style={styles.ghostActionText}>Enter manually instead</Text>
      </Pressable>
    </View>
  );
}

function ReviewStage({
  form,
  imageUri,
  usedAI,
  aiError,
  onChangeText,
  onChangeCalories,
  onChangeMacro,
}: {
  form: Nutrition;
  imageUri?: string;
  usedAI: boolean;
  aiError?: string;
  onChangeText: (patch: Partial<Nutrition>) => void;
  onChangeCalories: (v: number) => void;
  onChangeMacro: (m: MacroKey, v: number) => void;
}) {
  const confidencePct = form.confidence != null ? Math.round(form.confidence * 100) : null;
  return (
    <View style={{ gap: spacing.lg }}>
      {imageUri ? (
        <View style={styles.reviewImageWrap}>
          <Image source={{ uri: imageUri }} style={styles.reviewImage} contentFit="cover" />
          <View style={[styles.aiTag, { backgroundColor: usedAI ? colors.brand : colors.warning }]}>
            <Ionicons name={usedAI ? 'sparkles' : 'flask'} size={12} color={colors.black} />
            <Text style={styles.aiTagText}>{usedAI ? 'AI detected' : 'Demo estimate'}</Text>
          </View>
        </View>
      ) : null}

      {aiError ? <Text style={styles.errorNote}>Live AI unavailable ({aiError}). Showing an estimate you can edit.</Text> : null}

      <View>
        <Text style={styles.fieldLabel}>Food name</Text>
        <TextInput
          value={form.name}
          onChangeText={(t) => onChangeText({ name: t })}
          placeholder="e.g. Grilled chicken salad"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
      </View>

      <View>
        <Text style={styles.fieldLabel}>Serving</Text>
        <TextInput
          value={form.servingDesc}
          onChangeText={(t) => onChangeText({ servingDesc: t })}
          placeholder="1 plate"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
      </View>

      <View style={styles.calorieCard}>
        <Text style={styles.fieldLabel}>Calories</Text>
        <View style={styles.calorieRow}>
          <StepBtn icon="remove" onPress={() => onChangeCalories(form.calories - 10)} />
          <Text style={styles.calorieValue}>{Math.round(form.calories)}</Text>
          <StepBtn icon="add" onPress={() => onChangeCalories(form.calories + 10)} />
          <Text style={styles.kcalUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.macrosGrid}>
        {(['protein', 'carbs', 'fat'] as MacroKey[]).map((m) => (
          <View key={m} style={styles.macroBox}>
            <View style={styles.macroBoxHeader}>
              <View style={[styles.dot, { backgroundColor: macroMeta[m].color }]} />
              <Text style={styles.macroBoxLabel}>{macroMeta[m].label}</Text>
            </View>
            <Text style={styles.macroBoxValue}>{Math.round(form[m])}g</Text>
            <View style={styles.macroBtns}>
              <StepBtn small icon="remove" onPress={() => onChangeMacro(m, form[m] - 5)} />
              <StepBtn small icon="add" onPress={() => onChangeMacro(m, form[m] + 5)} />
            </View>
          </View>
        ))}
      </View>

      {confidencePct != null && usedAI ? (
        <Text style={styles.confidence}>AI confidence: {confidencePct}%</Text>
      ) : null}
    </View>
  );
}

function StepBtn({
  icon,
  onPress,
  small,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepBtn,
        small && styles.stepBtnSmall,
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}>
      <Ionicons name={icon} size={small ? 16 : 20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // pick stage
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  heroSub: { color: colors.textDim, fontSize: font.size.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  primaryActionText: { color: colors.black, fontSize: font.size.md, fontWeight: '800' },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  secondaryActionText: { color: colors.text, fontSize: font.size.md, fontWeight: '700' },
  ghostAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  ghostActionText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: '600' },

  // analyzing
  analyzing: { alignItems: 'center', gap: spacing.xl, paddingTop: spacing.xl },
  previewBig: { width: '100%', height: 240, borderRadius: radius.lg },
  analyzeBadge: { alignItems: 'center', gap: 8 },
  analyzeText: { color: colors.text, fontSize: font.size.lg, fontWeight: '700' },
  analyzeSub: { color: colors.textDim, fontSize: font.size.sm },

  // review
  reviewImageWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  reviewImage: { width: '100%', height: 200 },
  aiTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  aiTagText: { color: colors.black, fontSize: font.size.xs, fontWeight: '800' },
  errorNote: { color: colors.warning, fontSize: font.size.sm },
  fieldLabel: { color: colors.textDim, fontSize: font.size.sm, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text,
    fontSize: font.size.md,
    fontWeight: '600',
  },
  calorieCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  calorieValue: { color: colors.brand, fontSize: font.size.xxl, fontWeight: '800', minWidth: 90, textAlign: 'center' },
  kcalUnit: { color: colors.textFaint, fontSize: font.size.sm, fontWeight: '600' },
  macrosGrid: { flexDirection: 'row', gap: spacing.md },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  macroBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  macroBoxLabel: { color: colors.textDim, fontSize: font.size.xs, fontWeight: '600' },
  macroBoxValue: { color: colors.text, fontSize: font.size.lg, fontWeight: '800' },
  macroBtns: { flexDirection: 'row', gap: 8 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnSmall: { width: 32, height: 32 },
  confidence: { color: colors.textFaint, fontSize: font.size.xs, textAlign: 'center' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  saveText: { color: colors.black, fontSize: font.size.md, fontWeight: '800' },
});

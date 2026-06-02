import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { GlowBackdrop } from './GlowBackdrop';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  glow?: boolean;
};

const MAX_WIDTH = 520;

/** Page wrapper: dark bg, soft brand glow, safe-area top padding, centered max width. */
export function Screen({ children, scroll = true, contentStyle, glow = true }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padTop = insets.top + spacing.sm;
  const innerWidth = Math.min(width, MAX_WIDTH);

  const inner = (
    <View style={[styles.inner, { width: innerWidth, paddingTop: padTop }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      {glow ? <GlowBackdrop /> : null}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.center]}>{inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  center: { alignItems: 'center' },
  scrollContent: { alignItems: 'center' },
  inner: { paddingHorizontal: spacing.lg },
});

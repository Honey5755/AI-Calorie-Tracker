import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

const MAX_WIDTH = 520;

/** Page wrapper: dark background, safe-area top padding, optional scroll, centered max width. */
export function Screen({ children, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padTop = insets.top + spacing.sm;
  // Explicit numeric width avoids react-native-web's ambiguous "100% + maxWidth" sizing.
  const innerWidth = Math.min(width, MAX_WIDTH);

  const inner = (
    <View style={[styles.inner, { width: innerWidth, paddingTop: padTop }, contentStyle]}>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.root, styles.center]}>{inner}</View>;
  }
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}>
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center' },
  scrollContent: { alignItems: 'center' },
  inner: {
    paddingHorizontal: spacing.lg,
  },
});

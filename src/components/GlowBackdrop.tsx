import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

/** A soft radial brand glow behind content — adds depth on dark backgrounds. */
export function GlowBackdrop({
  color = colors.brand,
  opacity = 0.16,
  cy = '6%',
}: {
  color?: string;
  opacity?: number;
  cy?: string;
}) {
  const { width, height } = useWindowDimensions();
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy={cy} rx="75%" ry="48%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill="url(#glow)" />
      </Svg>
    </View>
  );
}

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors } from '@/theme';

type Props = {
  size: number;
  strokeWidth: number;
  progress: number; // 0..1
  color: string;
  trackColor?: string;
  children?: React.ReactNode; // centered content
  rounded?: boolean;
  animate?: boolean;
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A single circular progress ring (SVG). Reused by CalorieRing and MacroRing.
 * Fills from the top, clockwise. Animation is driven by React state (rAF) so the
 * arc renders reliably on web — animating SVG props via Animated is flaky there.
 */
export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  trackColor = colors.track,
  children,
  rounded = true,
  animate = true,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const target = Math.min(1, Math.max(0, progress || 0));

  const [shown, setShown] = useState(animate ? 0 : target);
  const fromRef = useRef(shown);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setShown(target);
      return;
    }
    const duration = 750;
    const start = now();
    const from = fromRef.current;
    const tick = () => {
      const elapsed = now() - start;
      const t = Math.min(1, elapsed / duration);
      const value = from + (target - from) * easeOutCubic(t);
      setShown(value);
      fromRef.current = value;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    // Guarantee we land on the final value even if rAF is throttled/paused.
    const settle = setTimeout(() => {
      fromRef.current = target;
      setShown(target);
    }, duration + 60);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, animate]);

  const strokeDashoffset = circumference * (1 - shown);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* rotate -90deg so progress starts at the top (SVG transform = valid on web) */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {shown > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap={rounded ? 'round' : 'butt'}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </G>
      </Svg>
      {children != null && (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      )}
    </View>
  );
}

import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { todayISO, weekdayLetter } from '@/lib/date';
import { colors, font } from '@/theme';

export type DayDatum = { dateISO: string; calories: number };

/** 7-day calorie bars with a dashed goal line. Pure SVG, responsive width. */
export function WeeklyBarChart({ data, goal }: { data: DayDatum[]; goal: number }) {
  const [width, setWidth] = useState(0);
  const height = 160;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const maxVal = Math.max(goal * 1.1, ...data.map((d) => d.calories), 1);
  const today = todayISO();

  const n = data.length || 1;
  const gap = 14;
  const barW = width > 0 ? Math.max(8, (width - gap * (n - 1)) / n) : 0;
  const goalY = height - (goal / maxVal) * height;

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {/* goal line */}
            <Line
              x1={0}
              y1={goalY}
              x2={width}
              y2={goalY}
              stroke={colors.textFaint}
              strokeWidth={1}
              strokeDasharray="4 5"
            />
            {data.map((d, i) => {
              const h = Math.max(2, (d.calories / maxVal) * height);
              const x = i * (barW + gap);
              const y = height - h;
              const over = d.calories > goal;
              const isToday = d.dateISO === today;
              const fill = d.calories === 0 ? colors.track : over ? colors.danger : colors.brand;
              return (
                <Rect
                  key={d.dateISO}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={6}
                  fill={fill}
                  opacity={isToday ? 1 : 0.55}
                />
              );
            })}
          </Svg>
        )}
      </View>

      <View style={styles.labels}>
        {data.map((d) => (
          <Text
            key={d.dateISO}
            style={[styles.label, d.dateISO === today && styles.labelToday]}>
            {weekdayLetter(d.dateISO)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  label: { color: colors.textFaint, fontSize: font.size.xs, fontWeight: '600', flex: 1, textAlign: 'center' },
  labelToday: { color: colors.brand, fontWeight: '800' },
});

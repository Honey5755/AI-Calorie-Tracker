import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, font, radius } from '@/theme';

/** Primary call-to-action with a mint→emerald gradient and a press-scale. */
export function GradientButton({
  label,
  onPress,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <LinearGradient
        colors={['#2BF0AB', '#13A877']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}>
        {icon ? <Ionicons name={icon} size={20} color={colors.black} /> : null}
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  text: { color: colors.black, fontSize: font.size.md, fontWeight: '800' },
});

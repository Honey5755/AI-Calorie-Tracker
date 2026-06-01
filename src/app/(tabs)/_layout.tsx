import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme';

/** Center floating "scan food" button, overlaid above the tab bar. */
function ScanButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + 72 }]}>
      <Pressable
        onPress={() => router.push('/add')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityLabel="Scan food">
        <Ionicons name="camera" size={28} color={colors.black} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingTop: 6,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            ...(Platform.OS === 'web'
              ? ({ position: 'fixed', left: 0, right: 0, bottom: 0 } as any)
              : null),
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Diary',
            tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>
      <ScanButton />
    </View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.bg,
  },
});

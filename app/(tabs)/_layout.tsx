/**
 * Filtered Figma Component: TabBar (UI kit -> TabBar, 375x78)
 * Gồm 2 tab trung tâm phục vụ đúng nghiệp vụ Study Planner:
 * 1. Lịch học & Bài tập (app/(tabs)/index.tsx)
 * 2. Môn học & Tiến độ (app/(tabs)/courses.tsx)
 */

import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MIN_TOUCH_TARGET, useAppTheme } from '../../src/theme/tokens';

export default function TabsLayout() {
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark, toggleTheme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundPrimary,
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderSubtle,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: typography.tabBar,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đổi giao diện Sáng hoặc Tối"
            onPress={toggleTheme}
            style={[
              styles.headerActionBtn,
              {
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                marginRight: spacing.md,
              },
            ]}
          >
            <Text style={[typography.footnoteSemibold, { color: colors.textPrimary }]}>
              {isDark ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kế hoạch & Lịch tuần',
          tabBarLabel: 'Lịch & Bài tập',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 20,
                height: 18,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: color,
                alignItems: 'center',
                paddingTop: 2,
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 2,
                  backgroundColor: color,
                  marginBottom: 2,
                }}
              />
              <View
                style={{
                  width: 10,
                  height: 2,
                  backgroundColor: color,
                }}
              />
            </View>
          ),
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thêm bài tập mới"
              onPress={() => router.push({ pathname: '/modal/editor', params: { mode: 'assignment' } })}
              style={[
                styles.headerActionBtn,
                {
                  minHeight: MIN_TOUCH_TARGET,
                  minWidth: MIN_TOUCH_TARGET,
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  marginLeft: spacing.md,
                },
              ]}
            >
              <Text style={[typography.footnoteSemibold, { color: colors.textInverse }]}>
                + Bài tập
              </Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Môn học & Tiến độ',
          tabBarLabel: 'Môn học & Hồ sơ',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 20,
                height: 18,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: color,
                  marginBottom: 3,
                }}
              />
              <View
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: color,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

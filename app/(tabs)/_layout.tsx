/**
 * Thanh điều hướng Tab tối giản kiểu Google Tasks (chỉ chữ, không dùng icon)
 */

import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
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
          height: 56,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIconStyle: {
          display: 'none',
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
              {isDark ? 'Sáng' : 'Tối'}
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Công việc học tập',
          tabBarLabel: 'Lịch và Bài tập',
          tabBarAccessibilityLabel: 'tab-planner-btn',
          headerLeft: () => (
            <Pressable
              testID="header-add-task-btn"
              accessibilityRole="button"
              accessibilityLabel="Thêm bài tập mới"
              onPress={() => router.push({ pathname: '/modal/editor', params: { mode: 'assignment' } })}
              style={[
                styles.headerActionBtn,
                {
                  minHeight: MIN_TOUCH_TARGET,
                  minWidth: MIN_TOUCH_TARGET,
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.md,
                  marginLeft: spacing.md,
                },
              ]}
            >
              <Text style={[typography.footnoteSemibold, { color: colors.textInverse }]}>
                Thêm bài tập
              </Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Môn học và Tiến độ',
          tabBarLabel: 'Môn học và Hồ sơ',
          tabBarAccessibilityLabel: 'tab-courses-btn',
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

/**
 * Module 1 (Bước 1.4): Màn hình +not-found.tsx
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AccessibleButton } from '../src/components/AccessibleButton';
import { useAppTheme } from '../src/theme/tokens';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundPrimary, padding: spacing.xxl }]}>
      <Text style={[typography.largeTitle, { color: colors.primary, marginBottom: spacing.sm }]}>
        404
      </Text>
      <Text style={[typography.title2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
        Màn hình không tồn tại
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl },
        ]}
      >
        Đường dẫn bạn vừa truy cập không hợp lệ hoặc bài tập đã bị xóa khỏi kế hoạch học tập.
      </Text>
      <AccessibleButton
        label="Về Màn Hình Chính"
        accessibilityLabel="Quay về màn hình chính Study Planner"
        onPress={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

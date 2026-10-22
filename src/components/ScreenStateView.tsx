/**
 * Module 1 (Bước 1.4): ScreenStateView
 * Chuẩn hóa 4 trạng thái bắt buộc cho mọi màn hình:
 * 1. Loading (Đang tải dữ liệu)
 * 2. Error + Retry (Lỗi mạng/server kèm nút Thử lại >= 44x44)
 * 3. Empty (Danh sách trống hoặc không khớp bộ lọc)
 * 4. Content (Hiển thị dữ liệu)
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/tokens';
import { AccessibleButton } from './AccessibleButton';

export interface ScreenStateViewProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  loadingLabel?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  children: React.ReactNode;
}

export const ScreenStateView: React.FC<ScreenStateViewProps> = ({
  isLoading,
  isError,
  isEmpty = false,
  loadingLabel = 'Đang đồng bộ dữ liệu học tập...',
  errorTitle = 'Không thể tải dữ liệu',
  errorMessage = 'Đã xảy ra sự cố kết nối với máy chủ. Vui lòng kiểm tra mạng và thử lại.',
  onRetry,
  emptyTitle = 'Chưa có dữ liệu phù hợp',
  emptyMessage = 'Hiện chưa có mục nào trong danh sách này hoặc bộ lọc không khớp.',
  emptyActionLabel,
  onEmptyAction,
  children,
}) => {
  const { colors, typography, spacing, radius } = useAppTheme();

  if (isLoading) {
    return (
      <View
        testID="screen-state-loading"
        accessibilityRole="progressbar"
        accessibilityLabel={loadingLabel}
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            padding: spacing.xxl,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            typography.subheadlineSemibold,
            { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          {loadingLabel}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        testID="screen-state-error"
        accessibilityRole="alert"
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.dangerSoft,
            borderColor: colors.danger,
            borderRadius: radius.lg,
            padding: spacing.xxl,
          },
        ]}
      >
        <Text
          style={[
            typography.title3,
            { color: colors.danger, marginBottom: spacing.xs, textAlign: 'center' },
          ]}
        >
          {errorTitle}
        </Text>
        <Text
          style={[
            typography.subheadline,
            { color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
          ]}
        >
          {errorMessage}
        </Text>
        {onRetry && (
          <AccessibleButton
            testID="screen-state-retry-button"
            label="Thử lại"
            accessibilityLabel="Thử tải lại dữ liệu"
            variant="primary"
            onPress={onRetry}
          />
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View
        testID="screen-state-empty"
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            padding: spacing.xxl,
          },
        ]}
      >
        <Text
          style={[
            typography.title3,
            { color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
          ]}
        >
          {emptyTitle}
        </Text>
        <Text
          style={[
            typography.subheadline,
            { color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
          ]}
        >
          {emptyMessage}
        </Text>
        {emptyActionLabel && onEmptyAction && (
          <AccessibleButton
            testID="screen-state-empty-action"
            label={emptyActionLabel}
            accessibilityLabel={emptyActionLabel}
            variant="outline"
            onPress={onEmptyAction}
          />
        )}
      </View>
    );
  }

  return <View testID="screen-state-content">{children}</View>;
};

const styles = StyleSheet.create({
  stateCard: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});

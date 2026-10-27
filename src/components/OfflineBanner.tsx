/**
 * OfflineBanner & Rollback Alert Banner — Không dùng icon, không dùng ngoặc đơn
 */

import { onlineManager } from '@tanstack/react-query';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOptimisticFeedbackStore } from '../hooks/useStudyQueries';
import {
  useIsEffectivelyOfflineSelector,
  useLastSyncedAtSelector,
  useNetworkSyncStore,
} from '../services/queryClient';
import { syncWhenBackOnline } from '../services/studyApi';
import { MIN_TOUCH_TARGET, useAppTheme } from '../theme/tokens';
import { formatLocalDateTime } from '../utils/dateUtils';

export const OfflineBanner: React.FC = () => {
  const { colors, typography, spacing, radius } = useAppTheme();
  const isOffline = useIsEffectivelyOfflineSelector();
  const lastSyncedAt = useLastSyncedAtSelector();
  const pendingMutationsCount = useNetworkSyncStore((s) => s.pendingMutationsCount);
  const simulatedOffline = useNetworkSyncStore((s) => s.simulatedOffline);
  const setSimulatedOffline = useNetworkSyncStore((s) => s.setSimulatedOffline);

  const rollbackErrorBanner = useOptimisticFeedbackStore((s) => s.rollbackErrorBanner);
  const setRollbackErrorBanner = useOptimisticFeedbackStore((s) => s.setRollbackErrorBanner);

  if (!isOffline && !rollbackErrorBanner) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
      {isOffline && (
        <View
          testID="offline-banner"
          accessibilityRole="alert"
          style={[
            styles.bannerBox,
            {
              backgroundColor: colors.offlineBannerBg,
              borderColor: colors.borderSubtle,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <View style={styles.textColumn}>
            <Text style={[typography.footnoteSemibold, { color: colors.offlineBannerText }]}>
              Chế độ ngoại tuyến
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {lastSyncedAt
                ? `Lần tải thành công cuối: ${formatLocalDateTime(lastSyncedAt)}`
                : 'Đang hiển thị bộ nhớ đệm cục bộ.'}
              {pendingMutationsCount > 0
                ? ` • ${pendingMutationsCount} thay đổi đã lưu vào hàng đợi chờ mạng.`
                : ' • Mọi thay đổi được bảo toàn.'}
            </Text>
          </View>
          {simulatedOffline && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bật lại kết nối mạng"
              onPress={() => {
                setSimulatedOffline(false);
                onlineManager.setOnline(true);
                void syncWhenBackOnline();
              }}
              style={[
                styles.actionPill,
                {
                  minHeight: MIN_TOUCH_TARGET,
                  minWidth: MIN_TOUCH_TARGET,
                  backgroundColor: colors.surfaceCard,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: colors.primary }]}>Bật mạng</Text>
            </Pressable>
          )}
        </View>
      )}

      {rollbackErrorBanner && (
        <View
          testID="rollback-error-banner"
          accessibilityRole="alert"
          style={[
            styles.bannerBox,
            {
              backgroundColor: colors.dangerSoft,
              borderColor: colors.danger,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <View style={styles.textColumn}>
            <Text style={[typography.footnoteSemibold, { color: colors.danger }]}>
              Đã khôi phục trạng thái ban đầu
            </Text>
            <Text style={[typography.caption, { color: colors.textPrimary, marginTop: 2 }]}>
              {rollbackErrorBanner}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo lỗi rollback"
            onPress={() => setRollbackErrorBanner(null)}
            style={[
              styles.actionPill,
              {
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                backgroundColor: colors.surfaceCard,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.captionSemibold, { color: colors.danger }]}>Đóng</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerBox: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  actionPill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

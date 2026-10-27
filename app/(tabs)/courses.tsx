/**
 * Module 3 (Bước 3.3) & Module 2 (Bước 2.4):
 * Màn hình Môn học & Thống kê Tiến độ Động — app/(tabs)/courses.tsx (Màn hình 2/5+)
 * Giao diện lọc & chuyển thể từ "Student Planner App (Community).fig":
 * - Màn hình "1.3. Academic items", "1.2. Academic semesters" & "1. Profile"
 * - Hiển thị danh sách 5–7 môn học kèm thanh tiến độ trực quan (Completed vs. Outstanding)
 *   lấy từ hàm computeCourseProgress(courses, assignments) (computed, never stored).
 * - Tích hợp thẻ Hồ sơ Sinh viên, nút Sign Out (xóa sạch SecureStore + queryClient.clear()),
 *   bộ chuyển đổi Light/Dark mode và bảng điều khiển kiểm thử Offline / Lỗi 500.
 */

import { onlineManager } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { ScreenStateView } from '../../src/components/ScreenStateView';
import {
  useAssignmentsQuery,
  useCoursesQuery,
  useOptimisticFeedbackStore,
} from '../../src/hooks/useStudyQueries';
import { useNetworkSyncStore } from '../../src/services/queryClient';
import { useAuthStore, useCurrentUser } from '../../src/store/useAuthStore';
import { usePlannerFilterStore } from '../../src/store/usePlannerFilterStore';
import { MIN_TOUCH_TARGET, useAppTheme } from '../../src/theme/tokens';
import {
  computeCourseProgress,
  computeOverallProgress,
} from '../../src/utils/progressSelector';

export default function CoursesAndProgressScreen() {
  const router = useRouter();
  const {
    colors,
    typography,
    spacing,
    radius,
    preference,
    setPreference,
  } = useAppTheme();

  const currentUser = useCurrentUser();
  const signOut = useAuthStore((s) => s.signOut);

  const coursesQuery = useCoursesQuery();
  const assignmentsQuery = useAssignmentsQuery();

  const simulatedOffline = useNetworkSyncStore((s) => s.simulatedOffline);
  const setSimulatedOffline = useNetworkSyncStore((s) => s.setSimulatedOffline);
  const simulateServerError500 = useNetworkSyncStore((s) => s.simulateServerError500);
  const setSimulateServerError500 = useNetworkSyncStore((s) => s.setSimulateServerError500);

  const setCourseIdFilter = usePlannerFilterStore((s) => s.setCourseIdFilter);

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const isLoading = coursesQuery.isLoading || assignmentsQuery.isLoading;
  const isError = coursesQuery.isError || assignmentsQuery.isError;
  const isEmpty = !isLoading && !isError && courses.length === 0;

  // Tính toán tiến độ động mỗi lần render (computed, never stored)
  const courseProgressList = computeCourseProgress(courses, assignments);
  const overall = computeOverallProgress(courses, assignments);

  const handleToggleOfflineSimulation = () => {
    const nextOffline = !simulatedOffline;
    setSimulatedOffline(nextOffline);
    onlineManager.setOnline(!nextOffline);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.backgroundPrimary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxxl,
      }}
    >
      {/* =====================================================================
          THẺ TỔNG QUAN TIẾN ĐỘ HỌC KỲ (Computed Progress Summary)
         ===================================================================== */}
      <View
        testID="overall-progress-card"
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.caption2Semibold, { color: colors.primary }]}>
          THỐNG KÊ TIẾN ĐỘ ĐỘNG (COMPUTED, NEVER STORED)
        </Text>
        <View style={[styles.overallNumbersRow, { marginTop: spacing.xs }]}>
          <View>
            <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
              {overall.overallPercentage}%
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              Hoàn thành trên tổng số {overall.totalCourses} môn học
            </Text>
          </View>
          <View style={styles.overallCounters}>
            <View
              style={[
                styles.counterBadge,
                {
                  backgroundColor: colors.successSoft,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: colors.success }]}>
                Completed: {overall.completedAssignments}
              </Text>
            </View>
            <View
              style={[
                styles.counterBadge,
                {
                  backgroundColor: colors.warningSoft,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  marginTop: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: colors.warning }]}>
                Outstanding: {overall.outstandingAssignments}
              </Text>
            </View>
          </View>
        </View>

        {/* Thanh tiến độ tổng thể */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: colors.borderSubtle,
              borderRadius: radius.pill,
              marginTop: spacing.md,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${overall.overallPercentage}%`,
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
              },
            ]}
          />
        </View>
      </View>

      {/* =====================================================================
          DANH SÁCH MÔN HỌC & THANH TIẾN ĐỘ TỪNG MÔN (Figma 1.3. Academic items)
         ===================================================================== */}
      <View style={[styles.sectionHeaderRow, { marginBottom: spacing.sm }]}>
        <Text style={[typography.title3, { color: colors.textPrimary }]}>
          Danh sách Môn học ({courses.length})
        </Text>
        <AccessibleButton
          testID="add-course-button"
          label="+ Thêm môn học"
          accessibilityLabel="Thêm môn học mới"
          variant="outline"
          onPress={() =>
            router.push({ pathname: '/modal/editor', params: { mode: 'course' } })
          }
        />
      </View>

      <ScreenStateView
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          coursesQuery.error?.message ||
          assignmentsQuery.error?.message ||
          'Không thể tải danh sách môn học.'
        }
        onRetry={() => {
          void coursesQuery.refetch();
          void assignmentsQuery.refetch();
        }}
        isEmpty={isEmpty}
        emptyTitle="Chưa có môn học nào"
        emptyMessage="Hãy thêm từ 5 đến 7 môn học trong học kỳ để bắt đầu quản lý bài tập."
        emptyActionLabel="Thêm môn học đầu tiên"
        onEmptyAction={() =>
          router.push({ pathname: '/modal/editor', params: { mode: 'course' } })
        }
      >
        {courseProgressList.map((item) => {
          const courseObj = courses.find((c) => c.id === item.courseId);
          const palette = colors.courseColors[item.colour];

          return (
            <View
              key={item.courseId}
              testID={`course-progress-card-${item.courseId}`}
              style={[
                styles.courseCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={styles.courseCardTopRow}>
                <View style={styles.courseTitleBlock}>
                  <View
                    style={[
                      styles.codeBadge,
                      {
                        backgroundColor: palette.softBg,
                        borderColor: palette.border,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 3,
                      },
                    ]}
                  >
                    <Text style={[typography.captionSemibold, { color: palette.text }]}>
                      {item.courseCode}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.headline,
                      { color: colors.textPrimary, marginTop: spacing.xs },
                    ]}
                  >
                    {item.courseName}
                  </Text>
                  {(courseObj?.instructor || courseObj?.room) && (
                    <Text
                      style={[
                        typography.footnote,
                        { color: colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {courseObj?.instructor ?? 'GV. Học phần'} • {courseObj?.room ?? 'Phòng học'}
                    </Text>
                  )}
                </View>

                <View style={styles.percentageBox}>
                  <Text
                    testID={`course-percentage-${item.courseId}`}
                    style={[typography.title2, { color: palette.accent }]}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              </View>

              {/* Thanh tiến độ động Completed vs. Outstanding */}
              <View
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radius.pill,
                    marginVertical: spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: palette.accent,
                      borderRadius: radius.pill,
                    },
                  ]}
                />
              </View>

              <View style={styles.statsFooterRow}>
                <View style={styles.statsRow}>
                  <Text
                    testID={`course-completed-${item.courseId}`}
                    style={[typography.footnoteSemibold, { color: colors.success }]}
                  >
                    ✓ Đã xong: {item.completed}
                  </Text>
                  <Text
                    testID={`course-outstanding-${item.courseId}`}
                    style={[
                      typography.footnoteSemibold,
                      { color: colors.warning, marginLeft: spacing.md },
                    ]}
                  >
                    ⏳ Tồn đọng: {item.outstanding}
                  </Text>
                </View>

                <View style={styles.courseActionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Lọc bài tập của môn ${item.courseName}`}
                    onPress={() => {
                      setCourseIdFilter(item.courseId);
                      router.push('/(tabs)');
                    }}
                    style={[
                      styles.smallActionBtn,
                      {
                        minHeight: MIN_TOUCH_TARGET,
                        minWidth: MIN_TOUCH_TARGET,
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm + 2,
                      },
                    ]}
                  >
                    <Text style={[typography.captionSemibold, { color: colors.textPrimary }]}>
                      Xem bài tập
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Chỉnh sửa môn học ${item.courseName}`}
                    onPress={() =>
                      router.push({
                        pathname: '/modal/editor',
                        params: { mode: 'course', courseId: item.courseId },
                      })
                    }
                    style={[
                      styles.smallActionBtn,
                      {
                        minHeight: MIN_TOUCH_TARGET,
                        minWidth: MIN_TOUCH_TARGET,
                        backgroundColor: palette.softBg,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm + 2,
                      },
                    ]}
                  >
                    <Text style={[typography.captionSemibold, { color: palette.text }]}>
                      Sửa môn
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScreenStateView>

      {/* =====================================================================
          THẺ HỒ SƠ SINH VIÊN, THEME TOKENS & KIỂM THỬ OFFLINE/ROLLBACK (Figma 1. Profile)
         ===================================================================== */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginTop: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.caption2Semibold, { color: colors.primary }]}>
          HỒ SƠ SINH VIÊN & BẢO MẬT PHIÊN (EXPO SECURESTORE)
        </Text>
        <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>
          {currentUser?.name ?? 'Nguyễn Văn A'}
        </Text>
        <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 2 }]}>
          {currentUser?.email ?? 'sinhvien01@example.edu.vn'}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {currentUser?.faculty ?? 'Khoa Công nghệ Thông tin'}
        </Text>

        {/* Bộ chọn chế độ màu Light / Dark / System từ 1 file tokens.ts */}
        <Text
          style={[
            typography.captionSemibold,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
          ]}
        >
          CHẾ ĐỘ GIAO DIỆN (TỪ 1 FILE TOKENS.TS DUY NHẤT):
        </Text>
        <View style={styles.themeRow}>
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const active = preference === mode;
            const label =
              mode === 'light' ? 'Sáng' : mode === 'dark' ? 'Tối' : 'Hệ thống';
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`Chế độ màu ${label}`}
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(mode)}
                style={[
                  styles.themeModeBtn,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: active ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bảng điều khiển Demo Bảo vệ: Giả lập Mất mạng (Offline) & Giả lập lỗi Server 500 */}
        <Text
          style={[
            typography.captionSemibold,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
          ]}
        >
          BẢNG ĐIỀU KHIỂN DEMO BẢO VỆ (OFFLINE & OPTIMISTIC ROLLBACK):
        </Text>
        <View style={styles.demoLabButtons}>
          <AccessibleButton
            testID="toggle-offline-mode-btn"
            label={
              simulatedOffline
                ? 'Đang bật chế độ Offline (Bấm để Online)'
                : 'Bật giả lập Offline Mode (Mất mạng)'
            }
            variant={simulatedOffline ? 'outline' : 'secondary'}
            onPress={handleToggleOfflineSimulation}
          />
          <AccessibleButton
            testID="toggle-server-500-btn"
            label={
              simulateServerError500
                ? 'Đang bật Giả lập Lỗi 500 (Test Rollback)'
                : 'Bật giả lập Lỗi Server 500 (Test Rollback)'
            }
            variant={simulateServerError500 ? 'danger' : 'secondary'}
            onPress={() => {
              const next = !simulateServerError500;
              setSimulateServerError500(next);
              if (!next) {
                useOptimisticFeedbackStore.getState().setRollbackErrorBanner(null);
              }
            }}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        {/* Nút Sign Out bắt buộc xóa sạch SecureStore & queryClient.clear() */}
        <AccessibleButton
          testID="sign-out-button"
          label="Đăng xuất (Sign Out & Xóa SecureStore)"
          accessibilityLabel="Đăng xuất hoàn toàn khỏi ứng dụng"
          variant="danger"
          onPress={handleSignOut}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  summaryCard: {
    borderWidth: 1,
  },
  overallNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallCounters: {
    alignItems: 'flex-end',
  },
  counterBadge: {
    alignSelf: 'flex-end',
  },
  progressTrack: {
    height: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseCard: {
    borderWidth: 1,
  },
  courseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  courseTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  percentageBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderWidth: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeModeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabButtons: {
    flexDirection: 'column',
  },
});

/**
 * Module 5 (Bước 5.3.2) & Module 6 (Bước 6.2.1):
 * Màn hình Chi tiết Bài tập — app/assignment/[id].tsx (Màn hình 5/5+ — Dynamic Route)
 * Giao diện lọc & chuyển thể từ "Student Planner App (Community).fig":
 * - Màn hình "1.1. Open Subject", "2.1. Open Notes" & "3.1. Add file" / "3.2. Added file"
 * - Hiển thị toàn bộ thông tin chi tiết của bài tập [id], tiến độ môn học liên kết.
 * - Nút đánh dấu Hoàn thành (Optimistic UI kèm Rollback tự động khi gặp lỗi 500).
 * - Khu vực Đính kèm / Xem ảnh chụp ghi chú viết tay hoặc bảng trắng (expo-image-picker).
 * - Khu vực Nhắc hạn Thông báo Cục bộ kèm nút "Gửi thông báo nhắc thử sau 5 giây".
 * - Xử lý đủ 4 trạng thái qua ScreenStateView.
 */

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
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
  useDeleteAssignmentMutation,
  useOptimisticFeedbackStore,
  useToggleCompleteMutation,
  useUpdateAssignmentMutation,
} from '../../src/hooks/useStudyQueries';
import {
  scheduleAssignmentReminder,
  scheduleDemoReminderIn5Seconds,
} from '../../src/services/notifications';
import { useNetworkSyncStore } from '../../src/services/queryClient';
import { useAppTheme } from '../../src/theme/tokens';
import {
  formatLocalDateTime,
  getDeadlineBadgeInfo,
} from '../../src/utils/dateUtils';
import { computeCourseProgress } from '../../src/utils/progressSelector';

// Ảnh SVG data URI mô phỏng bảng trắng / ghi chú viết tay dùng khi chạy trên máy ảo không có camera
const SAMPLE_WHITEBOARD_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radius } = useAppTheme();

  const coursesQuery = useCoursesQuery();
  const assignmentsQuery = useAssignmentsQuery();
  const toggleCompleteMutation = useToggleCompleteMutation();
  const updateAssignmentMutation = useUpdateAssignmentMutation();
  const deleteAssignmentMutation = useDeleteAssignmentMutation();

  const simulateServerError500 = useNetworkSyncStore((s) => s.simulateServerError500);
  const setSimulateServerError500 = useNetworkSyncStore((s) => s.setSimulateServerError500);
  const rollbackErrorBanner = useOptimisticFeedbackStore((s) => s.rollbackErrorBanner);

  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const assignment = assignments.find((item) => item.id === id);
  const course = courses.find((c) => c.id === assignment?.courseId);

  const isLoading = coursesQuery.isLoading || assignmentsQuery.isLoading;
  const isError = coursesQuery.isError || assignmentsQuery.isError;
  const isEmpty = !isLoading && !isError && !assignment;

  // Tiến độ động của môn học chứa bài tập này
  const courseProgress = computeCourseProgress(courses, assignments).find(
    (p) => p.courseId === assignment?.courseId
  );

  const handleToggleOptimisticComplete = () => {
    if (!assignment) return;
    toggleCompleteMutation.mutate({
      assignmentId: assignment.id,
      nextStatus: assignment.status === 'completed' ? 'pending' : 'completed',
    });
  };

  const handlePickImageFromLibrary = async () => {
    if (!assignment) return;
    setPhotoFeedback(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoFeedback('Chưa cấp quyền truy cập Thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await updateAssignmentMutation.mutateAsync({
          id: assignment.id,
          photoUri: result.assets[0].uri,
        });
        setPhotoFeedback('Đã đính kèm ảnh chụp ghi chú từ thư viện thành công!');
      }
    } catch {
      setPhotoFeedback('Không thể mở thư viện ảnh trên thiết bị này.');
    }
  };

  const handleTakePhotoFromCamera = async () => {
    if (!assignment) return;
    setPhotoFeedback(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPhotoFeedback('Chưa cấp quyền sử dụng Camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await updateAssignmentMutation.mutateAsync({
          id: assignment.id,
          photoUri: result.assets[0].uri,
        });
        setPhotoFeedback('Đã chụp và đính kèm ảnh bảng trắng/ghi chú thành công!');
      }
    } catch {
      setPhotoFeedback('Thiết bị/máy ảo không hỗ trợ Camera trực tiếp.');
    }
  };

  const handleAttachSampleWhiteboard = async () => {
    if (!assignment) return;
    setPhotoFeedback(null);
    await updateAssignmentMutation.mutateAsync({
      id: assignment.id,
      photoUri: SAMPLE_WHITEBOARD_DATA_URI,
    });
    setPhotoFeedback('Đã đính kèm ảnh ghi chú bảng trắng mẫu thành công!');
  };

  const handleRemovePhoto = async () => {
    if (!assignment) return;
    await updateAssignmentMutation.mutateAsync({
      id: assignment.id,
      photoUri: '',
    });
    setPhotoFeedback('Đã gỡ ảnh đính kèm khỏi bài tập.');
  };

  const handleDemoReminder5Seconds = async () => {
    if (!assignment) return;
    const res = await scheduleDemoReminderIn5Seconds(assignment, course?.name);
    setNotificationFeedback(res.message);
  };

  const handleScheduleDeadlineReminder = async () => {
    if (!assignment) return;
    const notifId = await scheduleAssignmentReminder(assignment, course?.name);
    if (notifId) {
      await updateAssignmentMutation.mutateAsync({
        id: assignment.id,
        notificationId: notifId,
      });
      setNotificationFeedback(
        `Đã lập lịch thông báo nhắc hạn tự động (Mã lịch: ${notifId.slice(0, 8)}).`
      );
    } else {
      setNotificationFeedback(
        'Đã ghi nhận cấu hình nhắc hạn (hoặc bài tập đã hoàn thành / quá hạn).'
      );
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignment) return;
    await deleteAssignmentMutation.mutateAsync({
      id: assignment.id,
      notificationId: assignment.notificationId,
    });
    router.back();
  };

  const palette = colors.courseColors[course?.colour ?? 'blue'];
  const deadlineInfo = assignment
    ? getDeadlineBadgeInfo(assignment.dueAt, assignment.status)
    : null;
  const isCompleted = assignment?.status === 'completed';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.backgroundPrimary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxxl,
      }}
    >
      <ScreenStateView
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          assignmentsQuery.error?.message ||
          coursesQuery.error?.message ||
          'Không thể tải chi tiết bài tập.'
        }
        onRetry={() => {
          void coursesQuery.refetch();
          void assignmentsQuery.refetch();
        }}
        isEmpty={isEmpty}
        emptyTitle="Không tìm thấy bài tập"
        emptyMessage="Bài tập này không tồn tại hoặc đã bị xóa khỏi danh sách."
        emptyActionLabel="Quay lại Lịch học"
        onEmptyAction={() => router.replace('/(tabs)')}
      >
        {assignment && (
          <View testID="assignment-detail-content">
            {/* ===============================================================
                PHẦN 1: HEADER BÀI TẬP & TIẾN ĐỘ MÔN HỌC (Figma 1.1. Open Subject -> TableHeader r=12)
               =============================================================== */}
            <View
              style={[
                styles.headerCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: palette.border,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.coursePill,
                    {
                      backgroundColor: palette.softBg,
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                    },
                  ]}
                >
                  <Text style={[typography.captionSemibold, { color: palette.text }]}>
                    {course?.code ?? 'COURSE'} • {course?.name ?? 'Học phần'}
                  </Text>
                </View>

                <View
                  testID="detail-status-badge"
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isCompleted
                        ? colors.successSoft
                        : colors.warningSoft,
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionSemibold,
                      { color: isCompleted ? colors.success : colors.warning },
                    ]}
                  >
                    {isCompleted ? 'COMPLETED • ĐÃ XONG' : 'PENDING • ĐANG CHỜ'}
                  </Text>
                </View>
              </View>

              <Text
                testID="detail-assignment-title"
                style={[
                  typography.title2,
                  {
                    color: colors.textPrimary,
                    marginTop: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                {assignment.title}
              </Text>

              <Text style={[typography.subheadlineSemibold, { color: palette.accent }]}>
                ⏰ Hạn nộp: {formatLocalDateTime(assignment.dueAt)} ({deadlineInfo?.label})
              </Text>

              {courseProgress && (
                <View
                  style={[
                    styles.courseProgressMini,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginTop: spacing.md,
                    },
                  ]}
                >
                  <Text
                    testID="detail-course-progress-text"
                    style={[typography.footnoteSemibold, { color: colors.textPrimary }]}
                  >
                    Tiến độ môn {course?.code}: {courseProgress.completed}/
                    {courseProgress.total} bài hoàn thành ({courseProgress.percentage}%)
                  </Text>
                </View>
              )}

              {/* Nút Đánh dấu Hoàn thành (Optimistic UI + Rollback) */}
              <View style={{ marginTop: spacing.lg }}>
                <AccessibleButton
                  testID="detail-optimistic-toggle-btn"
                  label={
                    isCompleted
                      ? '↩️ Đánh dấu Chưa hoàn thành (Optimistic UI)'
                      : '✅ Đánh dấu Hoàn thành Ngay (Optimistic UI)'
                  }
                  accessibilityLabel={
                    isCompleted
                      ? 'Đánh dấu bài tập chưa hoàn thành'
                      : 'Đánh dấu bài tập đã hoàn thành'
                  }
                  variant={isCompleted ? 'secondary' : 'primary'}
                  onPress={handleToggleOptimisticComplete}
                  style={{ minHeight: 54 }}
                />
              </View>

              {/* Công tắc thử nghiệm nhanh lỗi Server 500 để chứng minh Rollback */}
              <View style={{ marginTop: spacing.sm }}>
                <AccessibleButton
                  testID="detail-simulate-500-btn"
                  label={
                    simulateServerError500
                      ? '🔥 Chế độ Giả lập Lỗi 500: ĐANG BẬT (Bấm Hoàn thành sẽ tự Rollback)'
                      : '🧪 Bật giả lập Lỗi Server 500 (Để test Optimistic Rollback)'
                  }
                  variant={simulateServerError500 ? 'danger' : 'ghost'}
                  onPress={() => setSimulateServerError500(!simulateServerError500)}
                />
              </View>

              {rollbackErrorBanner && (
                <Text
                  testID="detail-rollback-alert"
                  style={[
                    typography.footnoteSemibold,
                    { color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
                  ]}
                >
                  {rollbackErrorBanner}
                </Text>
              )}
            </View>

            {/* ===============================================================
                PHẦN 2: GHI CHÚ HỌC TẬP (Figma 2.1. Open Notes -> InputNotes)
               =============================================================== */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                📝 Ghi chú & Yêu cầu Bài tập
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                {assignment.notes ||
                  'Chưa có ghi chú chi tiết cho bài tập này. Bấm Chỉnh sửa để bổ sung ghi chú.'}
              </Text>
            </View>

            {/* ===============================================================
                PHẦN 3: ĐÍNH KÈM ẢNH CHỤP GHI CHÚ VIẾT TAY / BẢNG TRẮNG
                (Module 5 Bước 5.2.3 & 5.3.2 — Figma 3.1. Add file / 3.2. Added file)
               =============================================================== */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                📷 Ảnh chụp Ghi chú Viết tay / Bảng trắng
              </Text>
              <Text
                style={[
                  typography.footnote,
                  { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
                ]}
              >
                Đính kèm ảnh chụp bảng trắng trên lớp hoặc vở ghi chú viết tay cho bài tập này.
              </Text>

              {assignment.photoUri ? (
                <View
                  testID="attached-photo-preview"
                  style={[
                    styles.photoPreviewBox,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.primary,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: assignment.photoUri }}
                    style={[styles.attachedImage, { borderRadius: radius.sm }]}
                    resizeMode="cover"
                  />
                  <Text
                    style={[
                      typography.footnoteSemibold,
                      { color: colors.success, marginTop: spacing.sm },
                    ]}
                  >
                    ✓ Đã đính kèm ảnh ghi chú vào bài tập
                  </Text>
                  <AccessibleButton
                    testID="remove-photo-btn"
                    label="Xóa ảnh đính kèm"
                    variant="danger"
                    onPress={handleRemovePhoto}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyPhotoBox,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.md,
                      padding: spacing.lg,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.footnote,
                      { color: colors.textSecondary, textAlign: 'center' },
                    ]}
                  >
                    Chưa có ảnh chụp ghi chú nào được đính kèm.
                  </Text>
                </View>
              )}

              <View style={styles.buttonStack}>
                <AccessibleButton
                  testID="pick-library-photo-btn"
                  label="Chọn ảnh từ Thư viện"
                  variant="outline"
                  onPress={handlePickImageFromLibrary}
                />
                <AccessibleButton
                  testID="take-camera-photo-btn"
                  label="Chụp ảnh Bảng trắng / Vở ghi"
                  variant="secondary"
                  onPress={handleTakePhotoFromCamera}
                />
                <AccessibleButton
                  testID="attach-sample-photo-btn"
                  label="Gắn ảnh Bảng trắng mẫu (Máy ảo)"
                  variant="secondary"
                  onPress={handleAttachSampleWhiteboard}
                />
              </View>

              {photoFeedback && (
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: colors.primary, marginTop: spacing.sm },
                  ]}
                >
                  {photoFeedback}
                </Text>
              )}
            </View>

            {/* ===============================================================
                PHẦN 4: NHẮC HẠN THÔNG BÁO CỤC BỘ & DEEP LINKING
                (Module 6 Bước 6.1 & 6.2 — Gửi thông báo nhắc thử sau 5 giây)
               =============================================================== */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                Nhắc hạn Thông báo Cục bộ & Deep Link
              </Text>
              <Text
                style={[
                  typography.footnote,
                  { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
                ]}
              >
                Khi chạm vào thông báo nhắc hạn, ứng dụng sẽ tự động điều hướng mở thẳng màn
                hình chi tiết bài tập này (`/assignment/{assignment.id}`).
              </Text>

              <View style={styles.buttonStack}>
                <AccessibleButton
                  testID="demo-notification-5s-btn"
                  label="Gửi thông báo nhắc thử sau 5 giây"
                  accessibilityLabel="Gửi thông báo nhắc thử sau 5 giây"
                  variant="primary"
                  onPress={handleDemoReminder5Seconds}
                />
                <AccessibleButton
                  testID="schedule-deadline-notif-btn"
                  label="Đặt lịch nhắc tự động theo hạn nộp"
                  variant="secondary"
                  onPress={handleScheduleDeadlineReminder}
                />
              </View>

              {notificationFeedback && (
                <Text
                  testID="notification-feedback-text"
                  style={[
                    typography.footnoteSemibold,
                    { color: colors.primary, marginTop: spacing.sm },
                  ]}
                >
                  {notificationFeedback}
                </Text>
              )}
            </View>

            {/* ===============================================================
                PHẦN 5: CHỈNH SỬA (MỞ MODAL) & XÓA BÀI TẬP
               =============================================================== */}
            <View style={styles.footerActionsRow}>
              <AccessibleButton
                testID="edit-assignment-modal-btn"
                label="Chỉnh sửa Bài tập"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/modal/editor',
                    params: { mode: 'assignment', assignmentId: assignment.id },
                  })
                }
                style={styles.flexOne}
              />
              <AccessibleButton
                testID="delete-assignment-btn"
                label="Xóa Bài tập"
                variant="danger"
                onPress={handleDeleteAssignment}
                style={styles.flexOne}
              />
            </View>
          </View>
        )}
      </ScreenStateView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  headerCard: {
    borderWidth: 1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  coursePill: {
    alignSelf: 'flex-start',
  },
  statusPill: {
    alignSelf: 'flex-start',
  },
  courseProgressMini: {
    width: '100%',
  },
  sectionCard: {
    borderWidth: 1,
  },
  photoPreviewBox: {
    borderWidth: 1,
    alignItems: 'center',
  },
  attachedImage: {
    width: '100%',
    height: 180,
  },
  emptyPhotoBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  buttonStack: {
    gap: 8,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

/**
 * Filtered Figma Component: LessonCard (UI kit -> LessonCard, 375x116)
 * Chuyển thể từ "Student Planner App (Community).fig":
 * - Cột trái (Time): Hiển thị giờ hạn nộp (HH:mm) và ngày ngắn gọn
 * - Cột phải (Description):
 *   + Nhãn Môn học in hoa (Caption2 Semibold 11/14) kèm chấm màu môn học
 *   + Tiêu đề bài tập (Footnote/Subheadline Semibold) + Nút đánh dấu hoàn thành (>= 44x44, Optimistic UI)
 *   + Huy hiệu thời hạn (Due Today, Due Tomorrow, Overdue, Completed) & chỉ báo có đính kèm ảnh/ghi chú
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Assignment, Course } from '../types/domain';
import { MIN_TOUCH_TARGET, useAppTheme } from '../theme/tokens';
import {
  DateInput,
  formatLocalDateTime,
  formatLocalTime,
  getDeadlineBadgeInfo,
} from '../utils/dateUtils';

export interface AssignmentLessonCardProps {
  assignment: Assignment;
  course?: Course;
  now?: DateInput;
  onPress: (assignmentId: string) => void;
  onToggleComplete: (assignmentId: string) => void;
}

export const AssignmentLessonCard: React.FC<AssignmentLessonCardProps> = ({
  assignment,
  course,
  now = new Date(),
  onPress,
  onToggleComplete,
}) => {
  const { colors, typography, spacing, radius } = useAppTheme();
  const coursePalette = colors.courseColors[course?.colour ?? 'blue'];
  const badge = getDeadlineBadgeInfo(assignment.dueAt, assignment.status, now);
  const isCompleted = assignment.status === 'completed';

  const getBadgeColors = () => {
    switch (badge.urgency) {
      case 'completed':
        return { bg: colors.successSoft, text: colors.success };
      case 'overdue':
        return { bg: colors.dangerSoft, text: colors.danger };
      case 'dueToday':
        return { bg: colors.warningSoft, text: colors.warning };
      case 'dueTomorrow':
        return { bg: colors.infoSoft, text: colors.info };
      default:
        return { bg: colors.backgroundSecondary, text: colors.textSecondary };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <View
      testID={`assignment-card-${assignment.id}`}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderSubtle,
          borderRadius: radius.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Thanh dọc màu môn học chuẩn Figma LessonCard */}
      <View
        style={[
          styles.courseAccentStrip,
          {
            backgroundColor: coursePalette.accent,
            borderTopLeftRadius: radius.lg,
            borderBottomLeftRadius: radius.lg,
          },
        ]}
      />

      <Pressable
        testID={`assignment-open-${assignment.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Mở chi tiết bài tập ${assignment.title}, môn ${
          course?.name ?? 'Học phần'
        }, trạng thái ${badge.label}`}
        onPress={() => onPress(assignment.id)}
        style={({ pressed }) => [
          styles.mainTouchArea,
          {
            paddingVertical: spacing.md,
            paddingLeft: spacing.md,
            paddingRight: spacing.xs,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Cột Time (Figma LessonCard -> Frame "Time" 63x116) */}
        <View
          style={[
            styles.timeColumn,
            {
              borderRightColor: colors.borderSubtle,
              paddingRight: spacing.sm,
              marginRight: spacing.md,
            },
          ]}
        >
          <Text style={[typography.footnoteSemibold, { color: colors.textPrimary }]}>
            {formatLocalTime(assignment.dueAt)}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatLocalDateTime(assignment.dueAt).split(' · ')[0].slice(0, 5)}
          </Text>
          <View
            style={[
              styles.courseCodePill,
              {
                backgroundColor: coursePalette.softBg,
                borderRadius: radius.sm,
                marginTop: spacing.xs,
                paddingHorizontal: 6,
                paddingVertical: 2,
              },
            ]}
          >
            <Text style={[typography.caption2Semibold, { color: coursePalette.text }]}>
              {course?.code ?? 'COURSE'}
            </Text>
          </View>
        </View>

        {/* Cột Description (Figma LessonCard -> Frame "description") */}
        <View style={styles.descriptionColumn}>
          <Text
            numberOfLines={1}
            style={[
              typography.caption2Semibold,
              {
                color: coursePalette.accent,
                textTransform: 'uppercase',
                marginBottom: 2,
              },
            ]}
          >
            {course?.name ?? 'Môn học học kỳ'}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              typography.subheadlineSemibold,
              {
                color: isCompleted ? colors.textTertiary : colors.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                marginBottom: spacing.xs,
              },
            ]}
          >
            {assignment.title}
          </Text>

          <View style={styles.metaFooterRow}>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: badgeColors.bg,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 3,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: badgeColors.text }]}>
                {badge.label}
              </Text>
            </View>

            {assignment.photoUri && (
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.xs + 2,
                    paddingVertical: 3,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.primary }]}>📷 Ảnh ghi chú</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Nút Indicator / Đánh dấu hoàn thành (>= 44x44 theo chuẩn Accessibility & Optimistic UI) */}
      <Pressable
        testID={`assignment-toggle-${assignment.id}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={
          isCompleted
            ? `Đánh dấu chưa hoàn thành cho ${assignment.title}`
            : `Đánh dấu hoàn thành cho ${assignment.title}`
        }
        onPress={() => onToggleComplete(assignment.id)}
        style={({ pressed }) => [
          styles.checkboxTouchTarget,
          {
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.checkboxCircle,
            {
              borderColor: isCompleted ? colors.success : colors.textTertiary,
              backgroundColor: isCompleted ? colors.success : 'transparent',
            },
          ]}
        >
          {isCompleted && (
            <Text style={[typography.captionSemibold, { color: colors.textInverse }]}>✓</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  courseAccentStrip: {
    width: 5,
    alignSelf: 'stretch',
  },
  mainTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    width: 72,
    borderRightWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  courseCodePill: {
    alignSelf: 'flex-start',
  },
  descriptionColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  metaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badgePill: {
    alignSelf: 'flex-start',
  },
  checkboxTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

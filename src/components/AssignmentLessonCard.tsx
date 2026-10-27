/**
 * AssignmentLessonCard — Phong cách danh sách công việc chuẩn Google Tasks
 * Không dùng icon/ký tự đặc biệt, không dùng màu sắc lòe loẹt, không dùng ngoặc đơn.
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
  const badge = getDeadlineBadgeInfo(assignment.dueAt, assignment.status, now);
  const isCompleted = assignment.status === 'completed';

  const getBadgeColors = () => {
    if (badge.urgency === 'overdue') {
      return { bg: colors.dangerSoft, text: colors.danger };
    }
    if (badge.urgency === 'completed' || badge.urgency === 'dueToday' || badge.urgency === 'dueTomorrow') {
      return { bg: colors.primarySoft, text: colors.primary };
    }
    return { bg: colors.backgroundSecondary, text: colors.textSecondary };
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
          borderRadius: radius.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {/* Nút hoàn thành tròn tối giản kiểu Google Tasks ở bên trái hoặc bên phải (giữ vùng chạm >= 44x44) */}
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
              borderColor: isCompleted ? colors.primary : colors.textSecondary,
              backgroundColor: isCompleted ? colors.primary : 'transparent',
            },
          ]}
        />
      </Pressable>

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
            paddingRight: spacing.md,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
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
                backgroundColor: colors.backgroundSecondary,
                borderRadius: radius.sm,
                marginTop: spacing.xs,
                paddingHorizontal: 6,
                paddingVertical: 2,
              },
            ]}
          >
            <Text style={[typography.caption2Semibold, { color: colors.textSecondary }]}>
              {course?.code ?? 'COURSE'}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionColumn}>
          <Text
            numberOfLines={1}
            style={[
              typography.captionSemibold,
              {
                color: colors.textSecondary,
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
                color: isCompleted ? colors.textSecondary : colors.textPrimary,
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
                  borderRadius: radius.pill,
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
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 3,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Có ảnh đính kèm
                </Text>
              </View>
            )}
          </View>
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
  mainTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    width: 68,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

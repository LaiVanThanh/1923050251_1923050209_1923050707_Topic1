/**
 * Module 4 (Bước 4.3 — Phân khu 1): Widget 48 Giờ Tới (48h Due Summary Widget)
 * Yêu cầu nâng cao lấy điểm > 8:
 * "A widget-style summary on the home screen showing what is due in the next 48 hours."
 * Thiết kế chuyển thể từ khu vực "ListNews / ViewCard-news (r=16)" ở đầu màn hình "1. Schedule" trong Figma.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Assignment, Course } from '../types/domain';
import { MIN_TOUCH_TARGET, useAppTheme } from '../theme/tokens';
import { DateInput, formatLocalTime, getDeadlineBadgeInfo } from '../utils/dateUtils';

export interface DueNext48hWidgetProps {
  assignmentsDue48h: Assignment[];
  courses: Course[];
  now?: DateInput;
  onSelectAssignment: (assignmentId: string) => void;
}

export const DueNext48hWidget: React.FC<DueNext48hWidgetProps> = ({
  assignmentsDue48h,
  courses,
  now = new Date(),
  onSelectAssignment,
}) => {
  const { colors, typography, spacing, radius } = useAppTheme();
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const count = assignmentsDue48h.length;

  return (
    <View
      testID="widget-48h-container"
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: count > 0 ? colors.primary : colors.borderSubtle,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={[typography.caption2Semibold, { color: colors.primary }]}>
            WIDGET 48 GIỜ TỚI • KHẨN CẤP
          </Text>
          <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
            {count > 0
              ? `${count} bài tập đến hạn trong 48 giờ tới`
              : 'Không có bài tập gấp trong 48 giờ tới'}
          </Text>
        </View>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: count > 0 ? colors.primary : colors.successSoft,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text
            testID="widget-48h-count"
            style={[
              typography.headline,
              { color: count > 0 ? colors.textInverse : colors.success },
            ]}
          >
            {count}
          </Text>
        </View>
      </View>

      {count === 0 ? (
        <Text
          style={[
            typography.footnote,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          Tuyệt vời! Bạn đã hoàn tất hoặc chưa có bài tập nào cần nộp gấp trong 2 ngày tới.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: spacing.md, gap: spacing.sm }}
        >
          {assignmentsDue48h.map((item) => {
            const course = courseMap.get(item.courseId);
            const palette = colors.courseColors[course?.colour ?? 'blue'];
            const deadlineInfo = getDeadlineBadgeInfo(item.dueAt, item.status, now);

            return (
              <Pressable
                key={item.id}
                testID={`widget-48h-item-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Bài tập gấp trong 48 giờ: ${item.title}, hạn ${deadlineInfo.label}`}
                onPress={() => onSelectAssignment(item.id)}
                style={({ pressed }) => [
                  styles.miniCard,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    backgroundColor: colors.surfaceCard,
                    borderColor: palette.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.miniHeaderRow}>
                  <View
                    style={[
                      styles.courseTag,
                      {
                        backgroundColor: palette.softBg,
                        borderRadius: radius.sm,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      },
                    ]}
                  >
                    <Text style={[typography.caption2Semibold, { color: palette.text }]}>
                      {course?.code ?? 'COURSE'}
                    </Text>
                  </View>
                  <Text style={[typography.captionSemibold, { color: colors.warning }]}>
                    {formatLocalTime(item.dueAt)}
                  </Text>
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    typography.footnoteSemibold,
                    { color: colors.textPrimary, marginVertical: spacing.xs },
                  ]}
                >
                  {item.title}
                </Text>

                <Text style={[typography.captionSemibold, { color: palette.accent }]}>
                  {deadlineInfo.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  widgetCard: {
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    paddingRight: 12,
  },
  countBadge: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCard: {
    width: 215,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  miniHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseTag: {
    alignSelf: 'flex-start',
  },
});

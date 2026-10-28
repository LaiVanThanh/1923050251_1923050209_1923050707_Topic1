/**
 * Màn hình Home Planner — app/(tabs)/index.tsx
 * Tông màu và bố cục tối giản chuẩn Google Tasks, không dùng icon, không dùng ngoặc đơn.
 */

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
import { AssignmentLessonCard } from '../../src/components/AssignmentLessonCard';
import { DueNext48hWidget } from '../../src/components/DueNext48hWidget';
import { ScreenStateView } from '../../src/components/ScreenStateView';
import {
  useAssignmentsQuery,
  useCoursesQuery,
  useToggleCompleteMutation,
} from '../../src/hooks/useStudyQueries';
import {
  StatusFilterValue,
  groupAssignmentsByWeek,
  selectDueInNext48HoursAssignments,
  selectFilteredAssignments,
  useCourseFilterSelector,
  usePlannerFilterStore,
  useSelectedDayStartMsSelector,
  useSelectedWeekRefSelector,
  useStatusFilterSelector,
  useViewModeSelector,
} from '../../src/store/usePlannerFilterStore';
import { MIN_TOUCH_TARGET, useAppTheme } from '../../src/theme/tokens';
import { formatMonthYearTitle } from '../../src/utils/dateUtils';

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'pending', label: 'Đang chờ' },
  { value: 'completed', label: 'Đã xong' },
];

export default function HomePlannerScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useAppTheme();

  const coursesQuery = useCoursesQuery();
  const assignmentsQuery = useAssignmentsQuery();
  const toggleCompleteMutation = useToggleCompleteMutation();

  const viewMode = useViewModeSelector();
  const courseIdFilter = useCourseFilterSelector();
  const statusFilter = useStatusFilterSelector();
  const selectedWeekRef = useSelectedWeekRefSelector();
  const selectedDayStartMs = useSelectedDayStartMsSelector();

  const setViewMode = usePlannerFilterStore((s) => s.setViewMode);
  const setCourseIdFilter = usePlannerFilterStore((s) => s.setCourseIdFilter);
  const setStatusFilter = usePlannerFilterStore((s) => s.setStatusFilter);
  const shiftWeek = usePlannerFilterStore((s) => s.shiftWeek);
  const setSelectedDayStartMs = usePlannerFilterStore((s) => s.setSelectedDayStartMs);
  const resetFilters = usePlannerFilterStore((s) => s.resetFilters);

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const isLoading = coursesQuery.isLoading || assignmentsQuery.isLoading;
  const isError = coursesQuery.isError || assignmentsQuery.isError;
  const errorMessage =
    assignmentsQuery.error?.message ||
    coursesQuery.error?.message ||
    'Không thể tải danh sách lịch học và bài tập. Vui lòng thử lại.';

  const dueNext48h = selectDueInNext48HoursAssignments(assignments);

  const filteredAssignments = selectFilteredAssignments(
    assignments,
    courseIdFilter,
    statusFilter
  );

  const weekColumns = groupAssignmentsByWeek(filteredAssignments, selectedWeekRef);
  const visibleWeekColumns =
    selectedDayStartMs !== null
      ? weekColumns.filter((col) => col.dayStartMs === selectedDayStartMs)
      : weekColumns;

  const totalInCurrentWeek = weekColumns.reduce(
    (sum, col) => sum + col.assignments.length,
    0
  );

  const isEmpty =
    viewMode === 'list'
      ? filteredAssignments.length === 0
      : selectedDayStartMs !== null
      ? visibleWeekColumns.every((c) => c.assignments.length === 0)
      : filteredAssignments.length === 0;

  const handleRetry = () => {
    void coursesQuery.refetch();
    void assignmentsQuery.refetch();
  };

  const handleOpenAssignment = (assignmentId: string) => {
    router.push(`/assignment/${assignmentId}`);
  };

  const handleToggleComplete = (assignmentId: string) => {
    toggleCompleteMutation.mutate({ assignmentId });
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
      {/* PHÂN KHU 1: WIDGET 48 GIỜ TỚI */}
      <DueNext48hWidget
        assignmentsDue48h={dueNext48h}
        courses={courses}
        onSelectAssignment={handleOpenAssignment}
      />

      {/* PHÂN KHU 2: THANH CHUYỂN ĐỔI LỊCH TUẦN / DANH SÁCH VÀ BỘ LỌC */}
      <View
        testID="planner-controls-zone"
        style={[
          styles.controlsCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderSubtle,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.scopeBarContainer,
            {
              backgroundColor: colors.scopeBarBg,
              borderRadius: radius.sm,
              padding: 4,
            },
          ]}
        >
          <Pressable
            testID="view-mode-weekly-btn"
            accessibilityRole="button"
            accessibilityLabel="Chế độ xem Lịch tuần Weekly View"
            accessibilityState={{ selected: viewMode === 'weekly' }}
            onPress={() => setViewMode('weekly')}
            style={[
              styles.scopeBarOption,
              {
                minHeight: MIN_TOUCH_TARGET,
                backgroundColor: viewMode === 'weekly' ? colors.scopeBarPill : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.subheadlineSemibold,
                {
                  color: viewMode === 'weekly' ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              Theo tuần
            </Text>
          </Pressable>

          <Pressable
            testID="view-mode-list-btn"
            accessibilityRole="button"
            accessibilityLabel="Chế độ xem Danh sách List View"
            accessibilityState={{ selected: viewMode === 'list' }}
            onPress={() => setViewMode('list')}
            style={[
              styles.scopeBarOption,
              {
                minHeight: MIN_TOUCH_TARGET,
                backgroundColor: viewMode === 'list' ? colors.scopeBarPill : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.subheadlineSemibold,
                {
                  color: viewMode === 'list' ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              Danh sách
            </Text>
          </Pressable>
        </View>

        <Text
          style={[
            typography.captionSemibold,
            {
              color: colors.textSecondary,
              marginTop: spacing.md,
              marginBottom: spacing.xs,
            },
          ]}
        >
          TRẠNG THÁI:
        </Text>
        <View style={styles.statusFilterRow}>
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.value;
            return (
              <Pressable
                key={item.value}
                testID={`status-filter-${item.value}`}
                accessibilityRole="button"
                accessibilityLabel={`Lọc trạng thái ${item.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => setStatusFilter(item.value)}
                style={[
                  styles.filterChip,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: MIN_TOUCH_TARGET,
                    backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                    borderColor: active ? colors.primary : colors.borderSubtle,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: active ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[
            typography.captionSemibold,
            {
              color: colors.textSecondary,
              marginTop: spacing.md,
              marginBottom: spacing.xs,
            },
          ]}
        >
          MÔN HỌC:
        </Text>
        <View style={styles.courseFilterGrid}>
          <Pressable
            testID="course-filter-ALL"
            accessibilityRole="button"
            accessibilityLabel="Lọc tất cả môn học"
            accessibilityState={{ selected: courseIdFilter === 'ALL' }}
            onPress={() => setCourseIdFilter('ALL')}
            style={[
              styles.filterChip,
              {
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                backgroundColor:
                  courseIdFilter === 'ALL' ? colors.primarySoft : colors.backgroundSecondary,
                borderColor: courseIdFilter === 'ALL' ? colors.primary : colors.borderSubtle,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                typography.footnoteSemibold,
                {
                  color: courseIdFilter === 'ALL' ? colors.primary : colors.textPrimary,
                },
              ]}
            >
              Tất cả môn • {courses.length}
            </Text>
          </Pressable>

          {courses.map((course) => {
            const active = courseIdFilter === course.id;
            return (
              <Pressable
                key={course.id}
                testID={`course-filter-${course.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Lọc môn học ${course.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => setCourseIdFilter(course.id)}
                style={[
                  styles.filterChip,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: MIN_TOUCH_TARGET,
                    backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                    borderColor: active ? colors.primary : colors.borderSubtle,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: active ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {course.code} • {course.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* PHÂN KHU 3: VÙNG DỮ LIỆU ĐỒNG NHẤT */}
      {viewMode === 'weekly' && (
        <View
          style={[
            styles.calendarStripCard,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.borderSubtle,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.calendarHeaderRow}>
            <View>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {formatMonthYearTitle(selectedWeekRef)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {totalInCurrentWeek} bài tập trong tuần này
              </Text>
            </View>
            <View style={styles.weekNavButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tuần trước"
                onPress={() => shiftWeek(-1)}
                style={[
                  styles.weekNavBtn,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: MIN_TOUCH_TARGET,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.captionSemibold, { color: colors.textPrimary }]}>
                  Trước
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Về tuần hiện tại"
                onPress={() => resetFilters()}
                style={[
                  styles.weekNavBtn,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: MIN_TOUCH_TARGET,
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.captionSemibold, { color: colors.primary }]}>
                  Hôm nay
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tuần kế tiếp"
                onPress={() => shiftWeek(1)}
                style={[
                  styles.weekNavBtn,
                  {
                    minHeight: MIN_TOUCH_TARGET,
                    minWidth: MIN_TOUCH_TARGET,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.captionSemibold, { color: colors.textPrimary }]}>
                  Sau
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.weekDaysRow, { marginTop: spacing.md }]}>
            {weekColumns.map((col) => {
              const isSelected = selectedDayStartMs === col.dayStartMs;
              const isToday = col.day.isToday;
              const hasTasks = col.assignments.length > 0;

              return (
                <Pressable
                  key={col.day.dateKey}
                  testID={`weekday-cell-${col.day.dateKey}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${col.day.fullLabel}, có ${col.assignments.length} bài tập`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() =>
                    setSelectedDayStartMs(isSelected ? null : col.dayStartMs)
                  }
                  style={[
                    styles.dayColumnBtn,
                    {
                      minWidth: MIN_TOUCH_TARGET,
                      minHeight: MIN_TOUCH_TARGET + 18,
                      backgroundColor: isSelected
                        ? colors.primary
                        : isToday
                        ? colors.primarySoft
                        : 'transparent',
                      borderRadius: radius.md,
                      paddingVertical: spacing.xs,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionSemibold,
                      {
                        color: isSelected
                          ? colors.textInverse
                          : isToday
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {col.day.shortLabel}
                  </Text>
                  <Text
                    style={[
                      typography.calloutSemibold,
                      {
                        color: isSelected
                          ? colors.textInverse
                          : isToday
                          ? colors.primary
                          : colors.textPrimary,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {col.day.dayOfMonth}
                  </Text>
                  <Text
                    style={[
                      typography.caption2Semibold,
                      {
                        color: hasTasks
                          ? isSelected
                            ? colors.textInverse
                            : colors.primary
                          : 'transparent',
                        marginTop: 2,
                      },
                    ]}
                  >
                    {col.assignments.length}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <ScreenStateView
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        isEmpty={isEmpty}
        emptyTitle="Không có bài tập khớp bộ lọc"
        emptyMessage="Không tìm thấy bài tập nào cho bộ lọc hiện tại. Bạn có thể đặt lại bộ lọc hoặc tạo bài tập mới."
        emptyActionLabel="Đặt lại bộ lọc"
        onEmptyAction={resetFilters}
      >
        {viewMode === 'weekly' ? (
          <View testID="weekly-view-content">
            {visibleWeekColumns.map((col) => (
              <View
                key={col.day.dateKey}
                testID={`week-day-group-${col.day.dateKey}`}
                style={{ marginBottom: spacing.md }}
              >
                <View
                  style={[
                    styles.daySubheadingBar,
                    {
                      backgroundColor: col.day.isToday
                        ? colors.primarySoft
                        : colors.backgroundSecondary,
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.subheadlineSemibold,
                      {
                        color: col.day.isToday ? colors.primary : colors.textPrimary,
                      },
                    ]}
                  >
                    {col.day.fullLabel} {col.day.isToday ? '• Hôm nay' : ''}
                  </Text>
                  <Text
                    style={[
                      typography.captionSemibold,
                      {
                        color: col.day.isToday ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {col.assignments.length} bài tập
                  </Text>
                </View>

                {col.assignments.length === 0 ? (
                  <Text
                    style={[
                      typography.footnote,
                      {
                        color: colors.textTertiary,
                        paddingHorizontal: spacing.md,
                        paddingBottom: spacing.xs,
                      },
                    ]}
                  >
                    Không có hạn nộp bài tập trong ngày này.
                  </Text>
                ) : (
                  col.assignments.map((item) => (
                    <AssignmentLessonCard
                      key={item.id}
                      assignment={item}
                      course={courseMap.get(item.courseId)}
                      onPress={handleOpenAssignment}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))
                )}
              </View>
            ))}

            {selectedDayStartMs === null &&
              filteredAssignments.length > totalInCurrentWeek && (
                <View style={{ marginTop: spacing.md }}>
                  <View
                    style={[
                      styles.daySubheadingBar,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.subheadlineSemibold,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Các bài tập ở tuần khác
                    </Text>
                    <Text
                      style={[
                        typography.captionSemibold,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {filteredAssignments.length - totalInCurrentWeek} bài tập
                    </Text>
                  </View>
                  {filteredAssignments
                    .filter(
                      (a) =>
                        !weekColumns.some((col) =>
                          col.assignments.some((ca) => ca.id === a.id)
                        )
                    )
                    .map((item) => (
                      <AssignmentLessonCard
                        key={item.id}
                        assignment={item}
                        course={courseMap.get(item.courseId)}
                        onPress={handleOpenAssignment}
                        onToggleComplete={handleToggleComplete}
                      />
                    ))}
                </View>
              )}
          </View>
        ) : (
          <View testID="list-view-content">
            <View
              style={[
                styles.daySubheadingBar,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.subheadlineSemibold, { color: colors.textPrimary }]}>
                Danh sách bài tập theo hạn nộp
              </Text>
              <Text style={[typography.captionSemibold, { color: colors.textSecondary }]}>
                {filteredAssignments.length} mục
              </Text>
            </View>

            {filteredAssignments.map((item) => (
              <AssignmentLessonCard
                key={item.id}
                assignment={item}
                course={courseMap.get(item.courseId)}
                onPress={handleOpenAssignment}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </View>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <AccessibleButton
            testID="home-add-assignment-btn"
            label="Tạo Bài Tập Mới"
            accessibilityLabel="Mở màn hình thêm bài tập mới"
            onPress={() =>
              router.push({ pathname: '/modal/editor', params: { mode: 'assignment' } })
            }
          />
        </View>
      </ScreenStateView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  controlsCard: {
    borderWidth: 1,
  },
  scopeBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scopeBarOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarStripCard: {
    borderWidth: 1,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekNavBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumnBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySubheadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

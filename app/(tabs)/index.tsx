/**
 * Module 4 (Bước 4.3): Màn hình Home Planner — app/(tabs)/index.tsx (Màn hình 4/5+)
 * Thiết kế lọc & chuyển thể từ "Student Planner App (Community).fig":
 * - Màn hình "1. Schedule" & "1.1.1. Select a date in schedule"
 * - Gồm 3 phân khu rõ ràng:
 *   + Phân khu 1 (Widget 48h tới): DueNext48hWidget hiển thị số lượng và danh sách bài tập hạn trong 48 giờ tới.
 *   + Phân khu 2 (Thanh chuyển đổi & Bộ lọc): Nút gạt Weekly View / List View (kiểu Scopebars của Figma),
 *     thanh lọc theo Môn học và theo Trạng thái (tất cả nút >= 44x44 kèm accessibilityRole & accessibilityLabel).
 *   + Phân khu 3 (Vùng Dữ liệu Đồng nhất): Hiển thị bài tập theo 7 ngày trong tuần (kèm thanh Calendar tuần của Figma)
 *     hoặc theo danh sách (LessonCard) kèm nhãn thời hạn (Due Today, Due Tomorrow, Overdue).
 *     Xử lý đủ 4 trạng thái (Loading, Empty khi bộ lọc không khớp, Error + nút Retry, Content).
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
  { value: 'pending', label: 'Đang chờ (Pending)' },
  { value: 'completed', label: 'Đã xong (Completed)' },
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

  // 1. Dữ liệu cho Phân khu 1 (Widget 48 giờ tới)
  const dueNext48h = selectDueInNext48HoursAssignments(assignments);

  // 2. Dữ liệu sau khi lọc theo Môn học & Trạng thái
  const filteredAssignments = selectFilteredAssignments(
    assignments,
    courseIdFilter,
    statusFilter
  );

  // 3. Phân bổ vào 7 cột ngày trong tuần theo startOfLocalDay(dueAt)
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
      {/* =====================================================================
          PHÂN KHU 1: WIDGET 48 GIỜ TỚI (48h Due Summary Widget)
         ===================================================================== */}
      <DueNext48hWidget
        assignmentsDue48h={dueNext48h}
        courses={courses}
        onSelectAssignment={handleOpenAssignment}
      />

      {/* =====================================================================
          PHÂN KHU 2: THANH CHUYỂN ĐỔI WEEKLY/LIST VIEW & BỘ LỌC
         ===================================================================== */}
      <View
        testID="planner-controls-zone"
        style={[
          styles.controlsCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          },
        ]}
      >
        {/* Nút gạt Scopebars từ Figma UI Kit ("Weekly View" / "List View", >= 44x44) */}
        <View
          style={[
            styles.scopeBarContainer,
            {
              backgroundColor: colors.scopeBarBg,
              borderRadius: radius.md,
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
                  color: viewMode === 'weekly' ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              Weekly View
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
                  color: viewMode === 'list' ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              List View
            </Text>
          </Pressable>
        </View>

        {/* Bộ lọc theo Trạng thái (ALL / pending / completed) */}
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
          LỌC THEO TRẠNG THÁI:
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
                    backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                    borderColor: active ? colors.primary : colors.borderSubtle,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: active ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bộ lọc theo Môn học */}
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
          LỌC THEO MÔN HỌC:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseFilterScroll}
        >
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
                  courseIdFilter === 'ALL' ? colors.primary : colors.backgroundSecondary,
                borderColor: courseIdFilter === 'ALL' ? colors.primary : colors.borderSubtle,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                typography.footnoteSemibold,
                {
                  color: courseIdFilter === 'ALL' ? colors.textInverse : colors.textPrimary,
                },
              ]}
            >
              Tất cả môn ({courses.length})
            </Text>
          </Pressable>

          {courses.map((course) => {
            const active = courseIdFilter === course.id;
            const palette = colors.courseColors[course.colour];
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
                    backgroundColor: active ? palette.accent : colors.backgroundSecondary,
                    borderColor: active ? palette.accent : colors.borderSubtle,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                ]}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: active ? colors.textInverse : palette.accent,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={[
                    typography.footnoteSemibold,
                    { color: active ? colors.textInverse : colors.textPrimary },
                  ]}
                >
                  {course.code} • {course.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* =====================================================================
          PHÂN KHU 3: VÙNG DỮ LIỆU ĐỒNG NHẤT (WEEKLY VIEW / LIST VIEW + 4 TRẠNG THÁI)
         ===================================================================== */}
      {viewMode === 'weekly' && (
        <View
          style={[
            styles.calendarStripCard,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.borderSubtle,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          {/* Tiêu đề lịch tuần + Nút chuyển tuần Trước / Nay / Sau (Figma UI kit -> Calendar) */}
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
                  },
                ]}
              >
                <Text style={[typography.subheadlineSemibold, { color: colors.textPrimary }]}>
                  ◀
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
                  },
                ]}
              >
                <Text style={[typography.subheadlineSemibold, { color: colors.textPrimary }]}>
                  ▶
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 7 cột ngày trong tuần (Figma Calendar Date circles 44x44 r=44) */}
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
                      borderRadius: radius.pill,
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
                  <View
                    style={[
                      styles.dayCountDot,
                      {
                        backgroundColor: hasTasks
                          ? isSelected
                            ? colors.textInverse
                            : colors.primary
                          : 'transparent',
                      },
                    ]}
                  />
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
                {/* Tiêu đề nhóm ngày chuẩn Figma UI Kit "TableSubheadings" */}
                <View
                  style={[
                    styles.daySubheadingBar,
                    {
                      backgroundColor: col.day.isToday
                        ? colors.primarySoft
                        : colors.backgroundSecondary,
                      borderRadius: radius.md,
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

            {/* Hiển thị thêm các bài tập ngoài tuần đang chọn để sinh viên không bỏ sót */}
            {selectedDayStartMs === null &&
              filteredAssignments.length > totalInCurrentWeek && (
                <View style={{ marginTop: spacing.md }}>
                  <View
                    style={[
                      styles.daySubheadingBar,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: radius.md,
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
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.subheadlineSemibold, { color: colors.textPrimary }]}>
                Danh sách tất cả bài tập (Sắp xếp theo hạn nộp)
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
            label="+ Tạo Bài Tập Mới"
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
  courseFilterScroll: {
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
  dayCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  daySubheadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

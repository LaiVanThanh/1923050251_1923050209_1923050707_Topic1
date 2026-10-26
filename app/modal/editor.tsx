/**
 * Module 3 (Bước 3.3.2): Modal Route — app/modal/editor.tsx (Màn hình 3/5+ — Modal Route)
 * Giao diện lọc & chuyển thể từ "Student Planner App (Community).fig":
 * - Màn hình "1.2. Add note", "ModalStack", "ModalActionBar" & ".Field" (borderRadius: 16)
 * - Cho phép sinh viên thêm mới hoặc chỉnh sửa:
 *   (A) Bài tập (chọn môn học, nhập tiêu đề, chọn/nhập ngày giờ hạn nộp, nhập ghi chú)
 *   (B) Môn học (mã học phần, tên môn học, màu sắc CourseColorKey, giảng viên, phòng học)
 * - Xử lý đủ 4 trạng thái qua ScreenStateView.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { ScreenStateView } from '../../src/components/ScreenStateView';
import {
  useAssignmentsQuery,
  useCoursesQuery,
  useCreateAssignmentMutation,
  useCreateCourseMutation,
  useUpdateAssignmentMutation,
  useUpdateCourseMutation,
} from '../../src/hooks/useStudyQueries';
import {
  COURSE_COLOR_OPTIONS,
  MIN_TOUCH_TARGET,
  useAppTheme,
} from '../../src/theme/tokens';
import { CourseColorKey } from '../../src/types/domain';
import { formatLocalDateTime } from '../../src/utils/dateUtils';

type EditorMode = 'assignment' | 'course';

interface DeadlinePreset {
  key: string;
  label: string;
  getIso: () => string;
}

const DEADLINE_PRESETS: DeadlinePreset[] = [
  {
    key: 'in6h',
    label: 'Hôm nay (+6h • Gấp 48h)',
    getIso: () => new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  },
  {
    key: 'tomorrow17',
    label: 'Ngày mai 17:00',
    getIso: () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        17,
        0,
        0,
        0
      ).toISOString();
    },
  },
  {
    key: 'tomorrow2330',
    label: 'Ngày mai 23:30 (Test biên)',
    getIso: () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        23,
        30,
        0,
        0
      ).toISOString();
    },
  },
  {
    key: 'in3days',
    label: 'Sau 3 ngày (14:00)',
    getIso: () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 3,
        14,
        0,
        0,
        0
      ).toISOString();
    },
  },
];

export default function ModalEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    assignmentId?: string;
    courseId?: string;
  }>();

  const { colors, typography, spacing, radius } = useAppTheme();

  const coursesQuery = useCoursesQuery();
  const assignmentsQuery = useAssignmentsQuery();

  const createAssignmentMutation = useCreateAssignmentMutation();
  const updateAssignmentMutation = useUpdateAssignmentMutation();
  const createCourseMutation = useCreateCourseMutation();
  const updateCourseMutation = useUpdateCourseMutation();

  const courses = coursesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const initialMode: EditorMode = params.mode === 'course' ? 'course' : 'assignment';
  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode);

  // State cho Form Bài tập
  const existingAssignment = assignments.find((a) => a.id === params.assignmentId);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    existingAssignment?.courseId ?? params.courseId ?? courses[0]?.id ?? ''
  );
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    existingAssignment?.title ?? ''
  );
  const [dueAtIso, setDueAtIso] = useState<string>(
    existingAssignment?.dueAt ?? DEADLINE_PRESETS[0].getIso()
  );
  const [notes, setNotes] = useState<string>(existingAssignment?.notes ?? '');

  // State cho Form Môn học
  const existingCourse = courses.find((c) => c.id === params.courseId);
  const [courseCode, setCourseCode] = useState<string>(existingCourse?.code ?? '');
  const [courseName, setCourseName] = useState<string>(existingCourse?.name ?? '');
  const [courseColour, setCourseColour] = useState<CourseColorKey>(
    existingCourse?.colour ?? 'blue'
  );
  const [instructor, setInstructor] = useState<string>(existingCourse?.instructor ?? '');
  const [room, setRoom] = useState<string>(existingCourse?.room ?? '');

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (existingAssignment) {
      setEditorMode('assignment');
      setSelectedCourseId(existingAssignment.courseId);
      setAssignmentTitle(existingAssignment.title);
      setDueAtIso(existingAssignment.dueAt);
      setNotes(existingAssignment.notes ?? '');
    }
  }, [existingAssignment]);

  useEffect(() => {
    if (existingCourse && params.mode === 'course') {
      setEditorMode('course');
      setCourseCode(existingCourse.code);
      setCourseName(existingCourse.name);
      setCourseColour(existingCourse.colour);
      setInstructor(existingCourse.instructor ?? '');
      setRoom(existingCourse.room ?? '');
    }
  }, [existingCourse, params.mode]);

  const isMutating =
    createAssignmentMutation.isPending ||
    updateAssignmentMutation.isPending ||
    createCourseMutation.isPending ||
    updateCourseMutation.isPending;

  const mutationError =
    createAssignmentMutation.error?.message ||
    updateAssignmentMutation.error?.message ||
    createCourseMutation.error?.message ||
    updateCourseMutation.error?.message ||
    validationError;

  const handleSaveAssignment = async () => {
    setValidationError(null);
    if (!selectedCourseId) {
      setValidationError('Vui lòng chọn một môn học cho bài tập.');
      return;
    }
    if (!assignmentTitle.trim()) {
      setValidationError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }
    const parsedDue = new Date(dueAtIso);
    if (Number.isNaN(parsedDue.getTime())) {
      setValidationError('Định dạng ngày giờ hạn nộp không hợp lệ.');
      return;
    }

    try {
      if (existingAssignment) {
        await updateAssignmentMutation.mutateAsync({
          id: existingAssignment.id,
          courseId: selectedCourseId,
          title: assignmentTitle.trim(),
          dueAt: parsedDue.toISOString(),
          notes: notes.trim() || undefined,
        });
      } else {
        await createAssignmentMutation.mutateAsync({
          courseId: selectedCourseId,
          title: assignmentTitle.trim(),
          dueAt: parsedDue.toISOString(),
          notes: notes.trim() || undefined,
        });
      }
      router.back();
    } catch {
      // Lỗi đã hiển thị qua mutationError trong ScreenStateView
    }
  };

  const handleSaveCourse = async () => {
    setValidationError(null);
    if (!courseCode.trim()) {
      setValidationError('Vui lòng nhập mã học phần (VD: MAT101).');
      return;
    }
    if (!courseName.trim()) {
      setValidationError('Vui lòng nhập tên môn học.');
      return;
    }

    try {
      if (existingCourse && params.mode === 'course') {
        await updateCourseMutation.mutateAsync({
          id: existingCourse.id,
          code: courseCode.trim().toUpperCase(),
          name: courseName.trim(),
          colour: courseColour,
          instructor: instructor.trim() || undefined,
          room: room.trim() || undefined,
        });
      } else {
        await createCourseMutation.mutateAsync({
          code: courseCode.trim().toUpperCase(),
          name: courseName.trim(),
          colour: courseColour,
          instructor: instructor.trim() || undefined,
          room: room.trim() || undefined,
        });
      }
      router.back();
    } catch {
      // Lỗi đã hiển thị qua mutationError
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thanh chuyển chế độ Modal (Thêm/Sửa Bài tập vs Môn học) kiểu Scopebars Figma */}
        <View
          style={[
            styles.scopeBar,
            {
              backgroundColor: colors.scopeBarBg,
              borderRadius: radius.md,
              padding: 4,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Pressable
            testID="editor-mode-assignment"
            accessibilityRole="button"
            accessibilityLabel="Chế độ biên tập Bài tập"
            accessibilityState={{ selected: editorMode === 'assignment' }}
            onPress={() => {
              setValidationError(null);
              setEditorMode('assignment');
            }}
            style={[
              styles.scopeOption,
              {
                minHeight: MIN_TOUCH_TARGET,
                backgroundColor:
                  editorMode === 'assignment' ? colors.scopeBarPill : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.subheadlineSemibold,
                {
                  color:
                    editorMode === 'assignment' ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              {existingAssignment ? 'Sửa bài tập' : 'Thêm bài tập'}
            </Text>
          </Pressable>

          <Pressable
            testID="editor-mode-course"
            accessibilityRole="button"
            accessibilityLabel="Chế độ biên tập Môn học"
            accessibilityState={{ selected: editorMode === 'course' }}
            onPress={() => {
              setValidationError(null);
              setEditorMode('course');
            }}
            style={[
              styles.scopeOption,
              {
                minHeight: MIN_TOUCH_TARGET,
                backgroundColor:
                  editorMode === 'course' ? colors.scopeBarPill : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.subheadlineSemibold,
                {
                  color: editorMode === 'course' ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              {existingCourse && params.mode === 'course' ? 'Sửa môn học' : 'Thêm môn học'}
            </Text>
          </Pressable>
        </View>

        <ScreenStateView
          isLoading={coursesQuery.isLoading || isMutating}
          loadingLabel="Đang lưu dữ liệu và đồng bộ..."
          isError={Boolean(mutationError)}
          errorTitle="Không thể lưu thông tin"
          errorMessage={mutationError ?? undefined}
          onRetry={() => {
            setValidationError(null);
            createAssignmentMutation.reset();
            updateAssignmentMutation.reset();
            createCourseMutation.reset();
            updateCourseMutation.reset();
          }}
          isEmpty={editorMode === 'assignment' && courses.length === 0}
          emptyTitle="Chưa có môn học nào"
          emptyMessage="Bạn cần tạo ít nhất 1 môn học trước khi thêm bài tập."
          emptyActionLabel="Chuyển sang tạo Môn học"
          onEmptyAction={() => setEditorMode('course')}
        >
          {editorMode === 'assignment' ? (
            <View testID="assignment-editor-form">
              {/* 1. Chọn môn học */}
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                1. Chọn môn học
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
              >
                {courses.map((course) => {
                  const selected = selectedCourseId === course.id;
                  const palette = colors.courseColors[course.colour];
                  return (
                    <Pressable
                      key={course.id}
                      testID={`select-course-${course.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn môn ${course.name}`}
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedCourseId(course.id)}
                      style={[
                        styles.courseOptionChip,
                        {
                          minHeight: MIN_TOUCH_TARGET,
                          backgroundColor: selected ? palette.accent : colors.backgroundSecondary,
                          borderColor: selected ? palette.accent : colors.borderSubtle,
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
                          backgroundColor: selected ? colors.textInverse : palette.accent,
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={[
                          typography.footnoteSemibold,
                          { color: selected ? colors.textInverse : colors.textPrimary },
                        ]}
                      >
                        {course.code} • {course.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* 2. Nhập tiêu đề bài tập (Figma .Field r=16) */}
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                2. Tiêu đề bài tập
              </Text>
              <TextInput
                testID="assignment-title-input"
                accessibilityLabel="Tiêu đề bài tập"
                value={assignmentTitle}
                onChangeText={setAssignmentTitle}
                placeholder="VD: Bài tập thực hành chương 2"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              {/* 3. Chọn nhanh hạn nộp theo giờ địa phương */}
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                3. Thời hạn nộp (Múi giờ địa phương): {formatLocalDateTime(dueAtIso)}
              </Text>
              <View style={[styles.presetGrid, { marginBottom: spacing.md }]}>
                {DEADLINE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.key}
                    testID={`deadline-preset-${preset.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Chọn hạn nộp ${preset.label}`}
                    onPress={() => setDueAtIso(preset.getIso())}
                    style={[
                      styles.presetBtn,
                      {
                        minHeight: MIN_TOUCH_TARGET,
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.md,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                  >
                    <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                      ⏱️ {preset.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* 4. Ghi chú chi tiết (Figma InputNotes) */}
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                4. Ghi chú học tập (Notes)
              </Text>
              <TextInput
                testID="assignment-notes-input"
                accessibilityLabel="Ghi chú bài tập"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Nhập yêu cầu chi tiết, tài liệu tham khảo hoặc ghi chú nhóm..."
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.notesArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    marginBottom: spacing.xl,
                  },
                ]}
              />

              <AccessibleButton
                testID="save-assignment-btn"
                label={existingAssignment ? 'Cập nhật Bài tập' : 'Lưu Bài tập Mới'}
                accessibilityLabel={
                  existingAssignment ? 'Cập nhật bài tập' : 'Lưu bài tập mới'
                }
                onPress={handleSaveAssignment}
                style={{ minHeight: 56 }}
              />
            </View>
          ) : (
            <View testID="course-editor-form">
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                1. Mã học phần
              </Text>
              <TextInput
                testID="course-code-input"
                accessibilityLabel="Mã học phần"
                value={courseCode}
                onChangeText={setCourseCode}
                autoCapitalize="characters"
                placeholder="VD: MAT101"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                2. Tên môn học
              </Text>
              <TextInput
                testID="course-name-input"
                accessibilityLabel="Tên môn học"
                value={courseName}
                onChangeText={setCourseName}
                placeholder="VD: Lập trình Thiết bị Di động"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.md,
                  },
                ]}
              />

              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                3. Màu nhận diện môn học (Từ bảng màu Figma Graphics)
              </Text>
              <View style={[styles.colorGrid, { marginBottom: spacing.md }]}>
                {COURSE_COLOR_OPTIONS.map((opt) => {
                  const selected = courseColour === opt.key;
                  const palette = colors.courseColors[opt.key];
                  return (
                    <Pressable
                      key={opt.key}
                      testID={`course-color-${opt.key}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn màu ${opt.label}`}
                      accessibilityState={{ selected }}
                      onPress={() => setCourseColour(opt.key)}
                      style={[
                        styles.colorOptionBtn,
                        {
                          minHeight: MIN_TOUCH_TARGET,
                          backgroundColor: selected ? palette.accent : palette.softBg,
                          borderColor: palette.accent,
                          borderRadius: radius.md,
                          paddingHorizontal: spacing.md,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.footnoteSemibold,
                          { color: selected ? colors.textInverse : palette.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                4. Giảng viên & Phòng học (Tùy chọn)
              </Text>
              <TextInput
                value={instructor}
                onChangeText={setInstructor}
                placeholder="Tên giảng viên hướng dẫn"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              />
              <TextInput
                value={room}
                onChangeText={setRoom}
                placeholder="Phòng học / Phòng Lab (VD: B3-204)"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.xl,
                  },
                ]}
              />

              <AccessibleButton
                testID="save-course-btn"
                label={
                  existingCourse && params.mode === 'course'
                    ? 'Cập nhật Môn học'
                    : 'Lưu Môn học Mới'
                }
                accessibilityLabel="Lưu thông tin môn học"
                onPress={handleSaveCourse}
                style={{ minHeight: 56 }}
              />
            </View>
          )}
        </ScreenStateView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scopeBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scopeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseOptionChip: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figmaField: {
    height: 56,
    borderWidth: 1,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesArea: {
    minHeight: 110,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOptionBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

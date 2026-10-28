/**
 * Modal Route — app/modal/editor.tsx
 * Giao diện tối giản chuẩn Google Tasks, không dùng icon, không dùng ngoặc đơn, không chọn màu lòe loẹt.
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
    label: 'Hôm nay sau 6 giờ',
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
    label: 'Ngày mai 23:30',
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
    label: 'Sau 3 ngày 14:00',
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

interface QuickHour {
  label: string;
  hour: number;
  minute: number;
}

const QUICK_HOURS: QuickHour[] = [
  { label: '08:00', hour: 8, minute: 0 },
  { label: '11:30', hour: 11, minute: 30 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '17:00', hour: 17, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '23:59', hour: 23, minute: 59 },
];

interface QuickDay {
  key: string;
  label: string;
  offsetDays: number;
}

const QUICK_DAYS: QuickDay[] = [
  { key: 'today', label: 'Hôm nay', offsetDays: 0 },
  { key: 'tomorrow', label: 'Ngày mai', offsetDays: 1 },
  { key: 'in3days', label: 'Sau 3 ngày', offsetDays: 3 },
  { key: 'in7days', label: 'Sau 7 ngày', offsetDays: 7 },
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

  const existingAssignment = assignments.find((a) => a.id === params.assignmentId);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    existingAssignment?.courseId ?? params.courseId ?? courses[0]?.id ?? ''
  );
  const [assignmentTitle, setAssignmentTitle] = useState<string>(
    existingAssignment?.title ?? ''
  );
  const initialDueIso = existingAssignment?.dueAt ?? DEADLINE_PRESETS[0].getIso();
  const [dueAtIso, setDueAtIso] = useState<string>(initialDueIso);

  const initialDate = new Date(initialDueIso);
  const validInitialDate = !Number.isNaN(initialDate.getTime()) ? initialDate : new Date();

  const [customHour, setCustomHour] = useState<string>(
    String(validInitialDate.getHours()).padStart(2, '0')
  );
  const [customMinute, setCustomMinute] = useState<string>(
    String(validInitialDate.getMinutes()).padStart(2, '0')
  );
  const [customDate, setCustomDate] = useState<string>(
    `${String(validInitialDate.getDate()).padStart(2, '0')}/${String(
      validInitialDate.getMonth() + 1
    ).padStart(2, '0')}/${validInitialDate.getFullYear()}`
  );
  const [notes, setNotes] = useState<string>(existingAssignment?.notes ?? '');

  const syncCustomInputs = (iso: string) => {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      setCustomHour(String(d.getHours()).padStart(2, '0'));
      setCustomMinute(String(d.getMinutes()).padStart(2, '0'));
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      setCustomDate(`${dd}/${mm}/${yyyy}`);
    }
  };

  const applyCustomTime = (hour: number, minute: number) => {
    const cur = new Date(dueAtIso);
    const valid = !Number.isNaN(cur.getTime()) ? cur : new Date();
    const clampedH = Math.max(0, Math.min(23, hour));
    const clampedM = Math.max(0, Math.min(59, minute));
    const next = new Date(
      valid.getFullYear(),
      valid.getMonth(),
      valid.getDate(),
      clampedH,
      clampedM,
      0,
      0
    );
    const iso = next.toISOString();
    setDueAtIso(iso);
    syncCustomInputs(iso);
  };

  const adjustTime = (deltaHours: number, deltaMinutes: number) => {
    const cur = new Date(dueAtIso);
    const valid = !Number.isNaN(cur.getTime()) ? cur : new Date();
    const next = new Date(
      valid.getTime() + deltaHours * 3600 * 1000 + deltaMinutes * 60 * 1000
    );
    const iso = next.toISOString();
    setDueAtIso(iso);
    syncCustomInputs(iso);
  };

  const setDayOffset = (offsetDays: number) => {
    const now = new Date();
    const cur = new Date(dueAtIso);
    const valid = !Number.isNaN(cur.getTime()) ? cur : new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offsetDays,
      valid.getHours(),
      valid.getMinutes(),
      0,
      0
    );
    const iso = next.toISOString();
    setDueAtIso(iso);
    syncCustomInputs(iso);
  };

  const handleHourChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setCustomHour(cleaned);
    const num = parseInt(cleaned, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 23 && cleaned.length === 2) {
      applyCustomTime(num, parseInt(customMinute, 10) || 0);
    }
  };

  const handleHourBlur = () => {
    const num = parseInt(customHour, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 23) {
      applyCustomTime(num, parseInt(customMinute, 10) || 0);
      setCustomHour(String(num).padStart(2, '0'));
    } else {
      const cur = new Date(dueAtIso);
      if (!Number.isNaN(cur.getTime())) {
        setCustomHour(String(cur.getHours()).padStart(2, '0'));
      }
    }
  };

  const handleMinuteChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setCustomMinute(cleaned);
    const num = parseInt(cleaned, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 59 && cleaned.length === 2) {
      applyCustomTime(parseInt(customHour, 10) || 0, num);
    }
  };

  const handleMinuteBlur = () => {
    const num = parseInt(customMinute, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 59) {
      applyCustomTime(parseInt(customHour, 10) || 0, num);
      setCustomMinute(String(num).padStart(2, '0'));
    } else {
      const cur = new Date(dueAtIso);
      if (!Number.isNaN(cur.getTime())) {
        setCustomMinute(String(cur.getMinutes()).padStart(2, '0'));
      }
    }
  };

  const handleDateChange = (text: string) => {
    setCustomDate(text);
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const y = parseInt(match[3], 10);
      const testDate = new Date(y, m, d);
      if (
        testDate.getFullYear() === y &&
        testDate.getMonth() === m &&
        testDate.getDate() === d
      ) {
        const cur = new Date(dueAtIso);
        const h = !Number.isNaN(cur.getTime()) ? cur.getHours() : 17;
        const min = !Number.isNaN(cur.getTime()) ? cur.getMinutes() : 0;
        const next = new Date(y, m, d, h, min, 0, 0);
        const iso = next.toISOString();
        setDueAtIso(iso);
      }
    }
  };

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
      syncCustomInputs(existingAssignment.dueAt);
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
      // Lỗi hiển thị qua mutationError
    }
  };

  const handleSaveCourse = async () => {
    setValidationError(null);
    if (!courseCode.trim()) {
      setValidationError('Vui lòng nhập mã học phần.');
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
      // Lỗi hiển thị qua mutationError
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
        <View
          style={[
            styles.scopeBar,
            {
              backgroundColor: colors.scopeBarBg,
              borderRadius: radius.sm,
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
                    editorMode === 'assignment' ? colors.primary : colors.textSecondary,
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
                  color: editorMode === 'course' ? colors.primary : colors.textSecondary,
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
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                1. Chọn môn học
              </Text>
              <View style={[styles.courseChipsGrid, { gap: spacing.sm, paddingBottom: spacing.md }]}>
                {courses.map((course) => {
                  const selected = selectedCourseId === course.id;
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
                          backgroundColor: selected
                            ? colors.primarySoft
                            : colors.backgroundSecondary,
                          borderColor: selected ? colors.primary : colors.borderSubtle,
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing.md,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.footnoteSemibold,
                          { color: selected ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {course.code} • {course.name}
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
                    borderRadius: radius.md,
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
                3. Thời hạn nộp: {formatLocalDateTime(dueAtIso)}
              </Text>

              <Text
                style={[
                  typography.captionSemibold,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Gợi ý mốc nhanh
              </Text>
              <View style={[styles.presetGrid, { marginBottom: spacing.sm }]}>
                {DEADLINE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.key}
                    testID={`deadline-preset-${preset.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Chọn hạn nộp ${preset.label}`}
                    onPress={() => {
                      const iso = preset.getIso();
                      setDueAtIso(iso);
                      syncCustomInputs(iso);
                    }}
                    style={[
                      styles.presetBtn,
                      {
                        minHeight: MIN_TOUCH_TARGET,
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.pill,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                  >
                    <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text
                style={[
                  typography.captionSemibold,
                  { color: colors.textSecondary, marginBottom: spacing.xs },
                ]}
              >
                Tùy chỉnh ngày và giờ nộp
              </Text>
              <View style={styles.timeCustomRow}>
                <View style={styles.timeInputBlock}>
                  <Text
                    style={[
                      typography.captionSemibold,
                      { color: colors.textSecondary, marginBottom: 4 },
                    ]}
                  >
                    Giờ
                  </Text>
                  <TextInput
                    testID="custom-deadline-hour-input"
                    accessibilityLabel="Nhập giờ nộp từ 00 đến 23"
                    value={customHour}
                    onChangeText={handleHourChange}
                    onBlur={handleHourBlur}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      typography.headline,
                      styles.timeDigitInput,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.md,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    typography.title2,
                    {
                      color: colors.textSecondary,
                      alignSelf: 'flex-end',
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  :
                </Text>

                <View style={styles.timeInputBlock}>
                  <Text
                    style={[
                      typography.captionSemibold,
                      { color: colors.textSecondary, marginBottom: 4 },
                    ]}
                  >
                    Phút
                  </Text>
                  <TextInput
                    testID="custom-deadline-minute-input"
                    accessibilityLabel="Nhập phút nộp từ 00 đến 59"
                    value={customMinute}
                    onChangeText={handleMinuteChange}
                    onBlur={handleMinuteBlur}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="mm"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      typography.headline,
                      styles.timeDigitInput,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.md,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.timeInputBlock, { flex: 1, minWidth: 140 }]}>
                  <Text
                    style={[
                      typography.captionSemibold,
                      { color: colors.textSecondary, marginBottom: 4 },
                    ]}
                  >
                    Ngày định dạng ngày tháng năm
                  </Text>
                  <TextInput
                    testID="custom-deadline-date-input"
                    accessibilityLabel="Nhập ngày nộp định dạng ngày tháng năm"
                    value={customDate}
                    onChangeText={handleDateChange}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      typography.body,
                      styles.dateInput,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.md,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text
                style={[
                  typography.captionSemibold,
                  { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs },
                ]}
              >
                Mốc giờ nhanh
              </Text>
              <View style={[styles.presetGrid, { marginBottom: spacing.xs }]}>
                {QUICK_HOURS.map((qh) => {
                  const isMatch =
                    parseInt(customHour, 10) === qh.hour &&
                    parseInt(customMinute, 10) === qh.minute;
                  return (
                    <Pressable
                      key={`${qh.hour}-${qh.minute}`}
                      testID={`quick-hour-${qh.label.replace(':', '')}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Đặt giờ nộp ${qh.label}`}
                      onPress={() => applyCustomTime(qh.hour, qh.minute)}
                      style={[
                        styles.presetBtn,
                        {
                          minHeight: MIN_TOUCH_TARGET,
                          backgroundColor: isMatch
                            ? colors.primarySoft
                            : colors.backgroundSecondary,
                          borderColor: isMatch ? colors.primary : colors.borderSubtle,
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing.md,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.footnoteSemibold,
                          { color: isMatch ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {qh.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[
                  typography.captionSemibold,
                  { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs },
                ]}
              >
                Điều chỉnh giờ
              </Text>
              <View style={[styles.presetGrid, { marginBottom: spacing.xs }]}>
                <Pressable
                  testID="adjust-time-sub-1h"
                  accessibilityRole="button"
                  accessibilityLabel="Lùi 1 giờ"
                  onPress={() => adjustTime(-1, 0)}
                  style={[
                    styles.presetBtn,
                    styles.adjustBtn,
                    {
                      minHeight: MIN_TOUCH_TARGET,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                    -1 giờ
                  </Text>
                </Pressable>
                <Pressable
                  testID="adjust-time-add-1h"
                  accessibilityRole="button"
                  accessibilityLabel="Tăng 1 giờ"
                  onPress={() => adjustTime(1, 0)}
                  style={[
                    styles.presetBtn,
                    styles.adjustBtn,
                    {
                      minHeight: MIN_TOUCH_TARGET,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                    +1 giờ
                  </Text>
                </Pressable>
                <Pressable
                  testID="adjust-time-sub-15m"
                  accessibilityRole="button"
                  accessibilityLabel="Lùi 15 phút"
                  onPress={() => adjustTime(0, -15)}
                  style={[
                    styles.presetBtn,
                    styles.adjustBtn,
                    {
                      minHeight: MIN_TOUCH_TARGET,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                    -15 phút
                  </Text>
                </Pressable>
                <Pressable
                  testID="adjust-time-add-15m"
                  accessibilityRole="button"
                  accessibilityLabel="Tăng 15 phút"
                  onPress={() => adjustTime(0, 15)}
                  style={[
                    styles.presetBtn,
                    styles.adjustBtn,
                    {
                      minHeight: MIN_TOUCH_TARGET,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.borderSubtle,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                    +15 phút
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  typography.captionSemibold,
                  { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs },
                ]}
              >
                Chọn ngày nhanh
              </Text>
              <View style={[styles.presetGrid, { marginBottom: spacing.md }]}>
                {QUICK_DAYS.map((qd) => (
                  <Pressable
                    key={qd.key}
                    testID={`quick-day-${qd.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Đặt ngày ${qd.label}`}
                    onPress={() => setDayOffset(qd.offsetDays)}
                    style={[
                      styles.presetBtn,
                      {
                        minHeight: MIN_TOUCH_TARGET,
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.pill,
                        paddingHorizontal: spacing.md,
                      },
                    ]}
                  >
                    <Text style={[typography.footnoteSemibold, { color: colors.primary }]}>
                      {qd.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                4. Ghi chú học tập
              </Text>
              <TextInput
                testID="assignment-notes-input"
                accessibilityLabel="Ghi chú bài tập"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Nhập yêu cầu chi tiết, tài liệu tham khảo hoặc ghi chú..."
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.notesArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.md,
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
                style={{ minHeight: 52, borderRadius: radius.pill }}
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
                    borderRadius: radius.md,
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
                placeholder="VD: Đại số tuyến tính"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.md,
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
                3. Giảng viên và Phòng học
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
                    borderRadius: radius.md,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.sm,
                  },
                ]}
              />
              <TextInput
                value={room}
                onChangeText={setRoom}
                placeholder="Phòng học VD: B3-204"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.md,
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
                style={{ minHeight: 52, borderRadius: radius.pill }}
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
  courseChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  figmaField: {
    height: 52,
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
  timeCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  timeInputBlock: {
    minWidth: 64,
  },
  timeDigitInput: {
    height: 48,
    borderWidth: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  dateInput: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  adjustBtn: {
    paddingHorizontal: 14,
  },
});

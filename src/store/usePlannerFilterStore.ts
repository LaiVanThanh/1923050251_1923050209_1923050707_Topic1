/**
 * Module 4 (Bước 4.1 & 4.2): Shared Store cho Bộ Lọc & Chế Độ Xem + Selectors Lọc & Gom Nhóm
 * - Quản lý viewMode ('weekly' | 'list'), courseIdFilter ('ALL' | string),
 *   statusFilter ('ALL' | 'pending' | 'completed'), và tuần lễ đang chọn.
 * - Cung cấp các selectors chuyên biệt (useViewModeSelector, useCourseFilterSelector, useStatusFilterSelector).
 * - Cung cấp hàm selectFilteredAssignments, hàm phân bổ vào 7 cột ngày trong tuần theo startOfLocalDay(dueAt),
 *   và hàm lọc riêng cho Widget 48 giờ.
 */

import { create } from 'zustand';
import { Assignment, AssignmentStatus } from '../types/domain';
import {
  DateInput,
  WeekDayItem,
  getWeekDays,
  isDueInNext48Hours,
  startOfLocalDay,
} from '../utils/dateUtils';

export type PlannerViewMode = 'weekly' | 'list';
export type CourseFilterValue = 'ALL' | string;
export type StatusFilterValue = 'ALL' | AssignmentStatus;

interface PlannerFilterStoreState {
  viewMode: PlannerViewMode;
  courseIdFilter: CourseFilterValue;
  statusFilter: StatusFilterValue;
  selectedWeekRef: string;
  selectedDayStartMs: number | null;
  setViewMode: (mode: PlannerViewMode) => void;
  setCourseIdFilter: (courseId: CourseFilterValue) => void;
  setStatusFilter: (status: StatusFilterValue) => void;
  setSelectedWeekRef: (isoDate: string) => void;
  shiftWeek: (deltaWeeks: number) => void;
  setSelectedDayStartMs: (dayStartMs: number | null) => void;
  resetFilters: () => void;
 

}

export const usePlannerFilterStore = create<PlannerFilterStoreState>((set) => ({
  viewMode: 'weekly',
  courseIdFilter: 'ALL',
  statusFilter: 'ALL',
  selectedWeekRef: new Date().toISOString(),
  selectedDayStartMs: null,

  setViewMode: (viewMode) => set({ viewMode }),
  setCourseIdFilter: (courseIdFilter) => set({ courseIdFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedWeekRef: (selectedWeekRef) => set({ selectedWeekRef, selectedDayStartMs: null }),
  shiftWeek: (deltaWeeks) =>
    set((state) => {
      const current = new Date(state.selectedWeekRef);
      const shifted = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + deltaWeeks * 7,
        12,
        0,
        0,
        0
      );
      return {
        selectedWeekRef: shifted.toISOString(),
        selectedDayStartMs: null,
      };
    }),
  setSelectedDayStartMs: (selectedDayStartMs) => set({ selectedDayStartMs }),
  resetFilters: () =>
    set({
      courseIdFilter: 'ALL',
      statusFilter: 'ALL',
      selectedWeekRef: new Date().toISOString(),
      selectedDayStartMs: null,
    }),
}));

/**
 * Selectors chuyên biệt trong Zustand store (Bước 4.2)
 */
export const useViewModeSelector = () => usePlannerFilterStore((s) => s.viewMode);
export const useCourseFilterSelector = () => usePlannerFilterStore((s) => s.courseIdFilter);
export const useStatusFilterSelector = () => usePlannerFilterStore((s) => s.statusFilter);
export const useSelectedWeekRefSelector = () => usePlannerFilterStore((s) => s.selectedWeekRef);
export const useSelectedDayStartMsSelector = () =>
  usePlannerFilterStore((s) => s.selectedDayStartMs);

/**
 * Lọc danh sách bài tập theo môn học (courseIdFilter) và trạng thái (statusFilter),
 * sắp xếp tăng dần theo hạn nộp dueAt.
 */
export function selectFilteredAssignments(
  assignments: Assignment[],
  courseIdFilter: CourseFilterValue,
  statusFilter: StatusFilterValue
): Assignment[] {
  return assignments
    .filter((item) => {
      const matchesCourse = courseIdFilter === 'ALL' || item.courseId === courseIdFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesCourse && matchesStatus;
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export interface WeekDayColumn {
  day: WeekDayItem;
  dayStartMs: number;
  assignments: Assignment[];
}

/**
 * Phân bổ bài tập vào 7 cột ngày trong tuần dựa trên mốc startOfLocalDay(dueAt)
 */
export function groupAssignmentsByWeek(
  assignments: Assignment[],
  refDate: DateInput = new Date(),
  now: DateInput = new Date()
): WeekDayColumn[] {
  const weekDays = getWeekDays(refDate, now);

  return weekDays.map((day) => {
    const dayAssignments = assignments
      .filter((item) => startOfLocalDay(item.dueAt) === day.timestamp)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    return {
      day,
      dayStartMs: day.timestamp,
      assignments: dayAssignments,
    };
  });
}

/**
 * Hàm lọc riêng cho Widget 48 giờ (Bước 4.2.3):
 * Lọc các bài tập có status === 'pending' và thời hạn nằm trong khoảng [now, now + 48h]
 */
export function selectDueInNext48HoursAssignments(
  assignments: Assignment[],
  now: DateInput = new Date()
): Assignment[] {
  return assignments
    .filter((item) => item.status === 'pending' && isDueInNext48Hours(item.dueAt, now))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

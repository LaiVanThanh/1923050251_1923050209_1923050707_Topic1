/**
 * Test Suite: Planner Filter Store & Selectors (Module 4)
 * Kiểm thử toàn diện:
 * 1. Zustand State: viewMode, courseIdFilter, statusFilter, selectedWeekRef, shiftWeek, resetFilters.
 * 2. Hàm lọc selectFilteredAssignments (lọc theo môn, trạng thái, sắp xếp theo dueAt).
 * 3. Hàm gom nhóm theo tuần groupAssignmentsByWeek (phân bổ đúng vào 7 ngày theo startOfLocalDay).
 * 4. Hàm lọc selectDueInNext48HoursAssignments (chỉ lấy pending trong vòng 48 giờ).
 */

import {
  groupAssignmentsByWeek,
  selectDueInNext48HoursAssignments,
  selectFilteredAssignments,
  usePlannerFilterStore,
} from '../src/store/usePlannerFilterStore';
import { Assignment } from '../src/types/domain';

describe('Planner Filter Store & Selectors (Module 4)', () => {
  beforeEach(() => {
    usePlannerFilterStore.getState().resetFilters();
    usePlannerFilterStore.getState().setViewMode('weekly');
  });

  describe('1. Store State Mutations', () => {
    it('mặc định ban đầu: viewMode = weekly, courseIdFilter = ALL, statusFilter = ALL', () => {
      const state = usePlannerFilterStore.getState();
      expect(state.viewMode).toBe('weekly');
      expect(state.courseIdFilter).toBe('ALL');
      expect(state.statusFilter).toBe('ALL');
      expect(state.selectedDayStartMs).toBeNull();
    });

    it('setViewMode chuyển đổi mượt mà giữa weekly và list', () => {
      usePlannerFilterStore.getState().setViewMode('list');
      expect(usePlannerFilterStore.getState().viewMode).toBe('list');

      usePlannerFilterStore.getState().setViewMode('weekly');
      expect(usePlannerFilterStore.getState().viewMode).toBe('weekly');
    });

    it('setCourseIdFilter và setStatusFilter cập nhật đúng tiêu chí lọc', () => {
      usePlannerFilterStore.getState().setCourseIdFilter('crs-math');
      expect(usePlannerFilterStore.getState().courseIdFilter).toBe('crs-math');

      usePlannerFilterStore.getState().setStatusFilter('completed');
      expect(usePlannerFilterStore.getState().statusFilter).toBe('completed');
    });

    it('shiftWeek dịch chuyển mốc tuần tới và lùi', () => {
      const initialIso = usePlannerFilterStore.getState().selectedWeekRef;
      const initialDate = new Date(initialIso);

      usePlannerFilterStore.getState().shiftWeek(1);
      const nextWeekDate = new Date(usePlannerFilterStore.getState().selectedWeekRef);
      const diffDaysNext = Math.round(
        (nextWeekDate.getTime() - initialDate.getTime()) / (24 * 3600 * 1000)
      );
      expect(diffDaysNext).toBe(7);

      usePlannerFilterStore.getState().shiftWeek(-1);
      const backDate = new Date(usePlannerFilterStore.getState().selectedWeekRef);
      const diffBack = Math.round(
        (backDate.getTime() - initialDate.getTime()) / (24 * 3600 * 1000)
      );
      expect(Math.abs(diffBack)).toBe(0);
    });

    it('resetFilters đặt lại toàn bộ bộ lọc về mặc định', () => {
      usePlannerFilterStore.getState().setCourseIdFilter('crs-123');
      usePlannerFilterStore.getState().setStatusFilter('pending');
      usePlannerFilterStore.getState().setSelectedDayStartMs(123456789);

      usePlannerFilterStore.getState().resetFilters();

      const state = usePlannerFilterStore.getState();
      expect(state.courseIdFilter).toBe('ALL');
      expect(state.statusFilter).toBe('ALL');
      expect(state.selectedDayStartMs).toBeNull();
    });
  });

  describe('2. selectFilteredAssignments', () => {
    const mockAssignments: Assignment[] = [
      {
        id: 'a1',
        courseId: 'crs-math',
        title: 'Bài tập 1',
        dueAt: '2026-10-28T10:00:00.000Z',
        status: 'pending',
      },
      {
        id: 'a2',
        courseId: 'crs-phy',
        title: 'Bài tập 2',
        dueAt: '2026-10-27T08:00:00.000Z',
        status: 'completed',
      },
      {
        id: 'a3',
        courseId: 'crs-math',
        title: 'Bài tập 3',
        dueAt: '2026-10-29T14:00:00.000Z',
        status: 'completed',
      },
    ];

    it('trả về toàn bộ và sắp xếp theo dueAt tăng dần khi filter là ALL / ALL', () => {
      const result = selectFilteredAssignments(mockAssignments, 'ALL', 'ALL');
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('a2'); // ngày 27
      expect(result[1].id).toBe('a1'); // ngày 28
      expect(result[2].id).toBe('a3'); // ngày 29
    });

    it('lọc chính xác theo môn học', () => {
      const result = selectFilteredAssignments(mockAssignments, 'crs-math', 'ALL');
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.courseId === 'crs-math')).toBe(true);
    });

    it('lọc chính xác theo trạng thái (pending hoặc completed)', () => {
      const pendingResult = selectFilteredAssignments(mockAssignments, 'ALL', 'pending');
      expect(pendingResult).toHaveLength(1);
      expect(pendingResult[0].id).toBe('a1');

      const completedResult = selectFilteredAssignments(mockAssignments, 'ALL', 'completed');
      expect(completedResult).toHaveLength(2);
      expect(completedResult.every((a) => a.status === 'completed')).toBe(true);
    });

    it('lọc đồng thời cả môn học và trạng thái', () => {
      const result = selectFilteredAssignments(mockAssignments, 'crs-math', 'completed');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a3');
    });
  });

  describe('3. groupAssignmentsByWeek', () => {
    it('phân bổ bài tập đúng vào 7 ngày từ Thứ Hai đến Chủ Nhật', () => {
      // Ngày tham chiếu: Thứ Tư 28/10/2026
      const refDate = new Date(2026, 9, 28, 10, 0, 0, 0);

      // Bài tập vào Thứ Tư (28/10) và Thứ Sáu (30/10)
      const assignments: Assignment[] = [
        {
          id: 'asg-wed',
          courseId: 'crs-1',
          title: 'Bài tập thứ tư',
          dueAt: new Date(2026, 9, 28, 15, 0, 0).toISOString(),
          status: 'pending',
        },
        {
          id: 'asg-fri',
          courseId: 'crs-1',
          title: 'Bài tập thứ sáu',
          dueAt: new Date(2026, 9, 30, 9, 0, 0).toISOString(),
          status: 'pending',
        },
      ];

      const columns = groupAssignmentsByWeek(assignments, refDate, refDate);
      expect(columns).toHaveLength(7);

      // Thứ Hai (index 0) không có bài tập
      expect(columns[0].assignments).toHaveLength(0);

      // Thứ Tư (index 2) có 1 bài tập
      expect(columns[2].day.shortLabel).toBe('T4');
      expect(columns[2].assignments).toHaveLength(1);
      expect(columns[2].assignments[0].id).toBe('asg-wed');

      // Thứ Sáu (index 4) có 1 bài tập
      expect(columns[4].day.shortLabel).toBe('T6');
      expect(columns[4].assignments).toHaveLength(1);
      expect(columns[4].assignments[0].id).toBe('asg-fri');
    });
  });

  describe('4. selectDueInNext48HoursAssignments', () => {
    it('chỉ lấy các bài tập pending có hạn trong vòng 48h tới, bỏ qua completed và quá 48h', () => {
      const now = new Date(2026, 9, 26, 12, 0, 0);

      const assignments: Assignment[] = [
        {
          id: 'due-in-10h',
          courseId: 'c1',
          title: 'Gấp trong 10h',
          dueAt: new Date(now.getTime() + 10 * 3600000).toISOString(),
          status: 'pending',
        },
        {
          id: 'completed-in-10h',
          courseId: 'c1',
          title: 'Đã xong sớm',
          dueAt: new Date(now.getTime() + 10 * 3600000).toISOString(),
          status: 'completed',
        },
        {
          id: 'due-in-50h',
          courseId: 'c1',
          title: 'Hơn 48h tới',
          dueAt: new Date(now.getTime() + 50 * 3600000).toISOString(),
          status: 'pending',
        },
        {
          id: 'overdue-past',
          courseId: 'c1',
          title: 'Quá hạn hôm qua',
          dueAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
          status: 'pending',
        },
      ];

      const urgent = selectDueInNext48HoursAssignments(assignments, now);
      expect(urgent).toHaveLength(1);
      expect(urgent[0].id).toBe('due-in-10h');
    });
  });
});

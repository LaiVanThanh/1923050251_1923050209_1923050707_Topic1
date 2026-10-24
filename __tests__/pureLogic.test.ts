/**
 * Bài Test Tự động số 1 (Pure-logic Test) — Bước 1.4.2 & Bước 3.4:
 * 1. Kiểm chứng bộ xử lý múi giờ dateUtils.ts:
 *    "Timezone and date handling. 'Due tomorrow' must mean the same thing at 23:30 as it does at 08:00."
 *    Chứng minh getCalendarDayDiff(dueAt, now) trả về đúng 1 (Due Tomorrow)
 *    dù sinh viên mở ứng dụng lúc 08:00 sáng hay 23:30 đêm theo giờ địa phương.
 * 2. Kiểm chứng isDueInNext48Hours và getWeekDays.
 * 3. Kiểm chứng computeCourseProgress (Bước 3.4):
 *    "Progress statistics: completed versus outstanding per course, computed, never stored."
 *    Khi thêm bài tập mới hoặc đổi trạng thái sang completed, tiến độ môn học cập nhật tức thì.
 */

import { Assignment, Course } from '../src/types/domain';
import {
  getCalendarDayDiff,
  getDeadlineBadgeInfo,
  getWeekDays,
  isDueInNext48Hours,
  startOfLocalDay,
} from '../src/utils/dateUtils';
import { computeCourseProgress } from '../src/utils/progressSelector';

describe('Test 1 (Pure-Logic): Bộ Xử Lý Múi Giờ & Thống Kê Tiến Độ Động', () => {
  describe('Bước 1.3 & 1.4: getCalendarDayDiff tại mốc 08:00 sáng và 23:30 đêm', () => {
    it('xác định chính xác Due Tomorrow (diff === 1) lúc 08:00 sáng và lúc 23:30 đêm cùng ngày', () => {
      // Mốc hiện tại: Ngày 26/10/2026 theo giờ địa phương
      const nowMorning0800 = new Date(2026, 9, 26, 8, 0, 0, 0); // 26/10/2026 08:00:00
      const nowLateNight2330 = new Date(2026, 9, 26, 23, 30, 0, 0); // 26/10/2026 23:30:00

      // Bài tập có hạn nộp vào ngày mai (27/10/2026):
      // Kể cả hạn nộp lúc 01:00 sáng ngày mai (chỉ cách 23:30 đêm nay 1 tiếng rưỡi)
      // hoặc lúc 17:00 chiều ngày mai
      const dueTomorrowEarly0100 = new Date(2026, 9, 27, 1, 0, 0, 0);
      const dueTomorrowAfternoon1700 = new Date(2026, 9, 27, 17, 0, 0, 0);

      expect(getCalendarDayDiff(dueTomorrowEarly0100, nowMorning0800)).toBe(1);
      expect(getCalendarDayDiff(dueTomorrowEarly0100, nowLateNight2330)).toBe(1);

      expect(getCalendarDayDiff(dueTomorrowAfternoon1700, nowMorning0800)).toBe(1);
      expect(getCalendarDayDiff(dueTomorrowAfternoon1700, nowLateNight2330)).toBe(1);

      // Nhãn hiển thị phải luôn là Due Tomorrow ở cả hai thời điểm 08:00 và 23:30
      const badgeAt0800 = getDeadlineBadgeInfo(dueTomorrowEarly0100, 'pending', nowMorning0800);
      const badgeAt2330 = getDeadlineBadgeInfo(dueTomorrowEarly0100, 'pending', nowLateNight2330);

      expect(badgeAt0800.urgency).toBe('dueTomorrow');
      expect(badgeAt2330.urgency).toBe('dueTomorrow');
      expect(badgeAt0800.label).toContain('Due Tomorrow');
      expect(badgeAt2330.label).toContain('Due Tomorrow');
    });

    it('startOfLocalDay đưa mọi giờ trong cùng một ngày địa phương về đúng 00:00:00.000', () => {
      const morning = new Date(2026, 9, 26, 8, 0, 15, 250);
      const night = new Date(2026, 9, 26, 23, 59, 59, 999);
      expect(startOfLocalDay(morning)).toBe(startOfLocalDay(night));
    });

    it('isDueInNext48Hours lọc chính xác bài tập trong khoảng [now, now + 48h]', () => {
      const now = new Date(2026, 9, 26, 12, 0, 0, 0);
      const in2Hours = new Date(now.getTime() + 2 * 3600 * 1000);
      const in48HoursExact = new Date(now.getTime() + 48 * 3600 * 1000);
      const in49Hours = new Date(now.getTime() + 49 * 3600 * 1000);
      const past1Hour = new Date(now.getTime() - 1 * 3600 * 1000);

      expect(isDueInNext48Hours(in2Hours, now)).toBe(true);
      expect(isDueInNext48Hours(in48HoursExact, now)).toBe(true);
      expect(isDueInNext48Hours(in49Hours, now)).toBe(false);
      expect(isDueInNext48Hours(past1Hour, now)).toBe(false);
    });

    it('getWeekDays tạo đúng mảng 7 ngày trong tuần bắt đầu từ Thứ Hai (T2) đến Chủ Nhật (CN)', () => {
      const refWednesday = new Date(2026, 9, 28, 15, 0, 0, 0);
      const days = getWeekDays(refWednesday, refWednesday);

      expect(days).toHaveLength(7);
      expect(days[0].shortLabel).toBe('T2');
      expect(days[6].shortLabel).toBe('CN');
      expect(days.some((d) => d.isToday)).toBe(true);
    });
  });

  describe('Bước 3.4: computeCourseProgress (Computed, Never Stored)', () => {
    const sampleCourses: Course[] = [
      {
        id: 'course-mobile',
        code: 'TH7011101',
        name: 'Lập trình Mobile',
        colour: 'blue',
      },
      {
        id: 'course-sad',
        code: 'TH7011205',
        name: 'Phân tích Thiết kế HTTT',
        colour: 'indigo',
      },
    ];

    it('tính toán chính xác completed, outstanding, percentage và cập nhật ngay khi thêm hoặc hoàn thành bài tập', () => {
      const initialAssignments: Assignment[] = [
        {
          id: 'a1',
          courseId: 'course-mobile',
          title: 'Module 1: Theme & Timezone',
          dueAt: new Date(2026, 9, 27, 10, 0).toISOString(),
          status: 'completed',
        },
        {
          id: 'a2',
          courseId: 'course-mobile',
          title: 'Module 2: SecureStore Auth',
          dueAt: new Date(2026, 9, 28, 10, 0).toISOString(),
          status: 'pending',
        },
      ];

      // Lần tính 1: 1 completed, 1 outstanding -> 50%
      const progressStep1 = computeCourseProgress(sampleCourses, initialAssignments);
      const mobileStep1 = progressStep1.find((p) => p.courseId === 'course-mobile');
      const sadStep1 = progressStep1.find((p) => p.courseId === 'course-sad');

      expect(mobileStep1).toEqual({
        courseId: 'course-mobile',
        courseCode: 'TH7011101',
        courseName: 'Lập trình Mobile',
        colour: 'blue',
        completed: 1,
        outstanding: 1,
        total: 2,
        percentage: 50,
      });
      expect(sadStep1?.total).toBe(0);
      expect(sadStep1?.percentage).toBe(0);

      // Lần tính 2: Thêm 1 bài tập mới vào course-mobile -> 1/3 = 33%
      const afterAddingAssignment: Assignment[] = [
        ...initialAssignments,
        {
          id: 'a3',
          courseId: 'course-mobile',
          title: 'Module 5: Offline & Optimistic Rollback',
          dueAt: new Date(2026, 9, 29, 10, 0).toISOString(),
          status: 'pending',
        },
      ];
      const mobileStep2 = computeCourseProgress(sampleCourses, afterAddingAssignment).find(
        (p) => p.courseId === 'course-mobile'
      );
      expect(mobileStep2?.completed).toBe(1);
      expect(mobileStep2?.outstanding).toBe(2);
      expect(mobileStep2?.percentage).toBe(33);

      // Lần tính 3: Đánh dấu bài tập a2 và a3 sang 'completed' -> 3/3 = 100%
      const afterCompletingAll = afterAddingAssignment.map((a) => ({
        ...a,
        status: 'completed' as const,
      }));
      const mobileStep3 = computeCourseProgress(sampleCourses, afterCompletingAll).find(
        (p) => p.courseId === 'course-mobile'
      );
      expect(mobileStep3?.completed).toBe(3);
      expect(mobileStep3?.outstanding).toBe(0);
      expect(mobileStep3?.percentage).toBe(100);
    });
  });
});

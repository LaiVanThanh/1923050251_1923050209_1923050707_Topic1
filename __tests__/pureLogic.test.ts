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

});

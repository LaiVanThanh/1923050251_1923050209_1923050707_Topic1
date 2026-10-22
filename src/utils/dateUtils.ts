/**
 * Module 1 (Bước 1.3): Bộ Xử Lý Múi Giờ & Ngày Tháng (Timezone & Date Engine)
 * Giải quyết triệt để cảnh báo trong đề bài:
 * "Timezone and date handling. 'Due tomorrow' must mean the same thing at 23:30 as it does at 08:00."
 *
 * Nguyên tắc cốt lõi:
 * - Tuyệt đối KHÔNG dùng toISOString().slice(0, 10) để so sánh ngày lịch vì toISOString() đổi sang UTC,
 *   làm mốc 01:00 sáng hoặc 23:30 đêm ở Việt Nam (UTC+7) bị lệch ngày.
 * - Luôn chuẩn hóa về 00:00:00.000 theo giờ địa phương (Local Time) qua startOfLocalDay().
 */

import { AssignmentStatus } from '../types/domain';

const MS_PER_DAY = 86_400_000;
const MS_PER_48_HOURS = 48 * 60 * 60 * 1000;

export type DateInput = string | Date | number;

function toValidDate(input: DateInput): Date {
  const d = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return new Date();
  }
  return d;
}

/**
 * 1. Đưa bất kỳ mốc thời gian nào về đúng 00:00:00.000 theo múi giờ địa phương của thiết bị.
 */
export function startOfLocalDay(dateInput: DateInput): number {
  const d = toValidDate(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

/**
 * Trả về chuỗi khóa ngày theo giờ địa phương định dạng YYYY-MM-DD (không dùng UTC).
 */
export function toLocalDateKey(dateInput: DateInput): string {
  const d = toValidDate(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 2. Tính độ lệch ngày lịch địa phương:
 * Math.round((startOfLocalDay(dueAt) - startOfLocalDay(now)) / 86400000)
 * Khi kết quả bằng 1, bài tập luôn được xác định là Due Tomorrow (Hạn ngày mai)
 * dù sinh viên mở app lúc 08:00 sáng hay 23:30 đêm.
 */
export function getCalendarDayDiff(dueAt: DateInput, now: DateInput = new Date()): number {
  const dueStart = startOfLocalDay(dueAt);
  const nowStart = startOfLocalDay(now);
  return Math.round((dueStart - nowStart) / MS_PER_DAY);
}

/**
 * 3. Kiểm tra bài tập có đến hạn trong vòng 48 giờ tới hay không [now, now + 48h]
 * Phục vụ Widget 48 giờ trên màn hình Home Planner.
 */
export function isDueInNext48Hours(dueAt: DateInput, now: DateInput = new Date()): boolean {
  const dueTime = toValidDate(dueAt).getTime();
  const nowTime = toValidDate(now).getTime();
  const diffMs = dueTime - nowTime;
  return diffMs >= 0 && diffMs <= MS_PER_48_HOURS;
}

export interface WeekDayItem {
  dateKey: string;
  timestamp: number;
  dayOfMonth: number;
  shortLabel: string;
  fullLabel: string;
  isToday: boolean;
}

const VI_SHORT_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VI_FULL_DAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

/**
 * Tạo mảng 7 ngày trong tuần (từ Thứ Hai đến Chủ Nhật) theo múi giờ địa phương.
 */
export function getWeekDays(refDate: DateInput = new Date(), now: DateInput = new Date()): WeekDayItem[] {
  const ref = toValidDate(refDate);
  const dayOfWeek = ref.getDay(); // 0 (CN) -> 6 (T7)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate() + diffToMonday,
    0,
    0,
    0,
    0
  );

  const todayKey = toLocalDateKey(now);
  const result: WeekDayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i,
      0,
      0,
      0,
      0
    );
    const dateKey = toLocalDateKey(current);
    const dow = current.getDay();
    result.push({
      dateKey,
      timestamp: current.getTime(),
      dayOfMonth: current.getDate(),
      shortLabel: VI_SHORT_DAYS[dow],
      fullLabel: `${VI_FULL_DAYS[dow]}, ${String(current.getDate()).padStart(2, '0')}/${String(
        current.getMonth() + 1
      ).padStart(2, '0')}`,
      isToday: dateKey === todayKey,
    });
  }

  return result;
}

export type DeadlineUrgency = 'completed' | 'overdue' | 'dueToday' | 'dueTomorrow' | 'upcoming';

export interface DeadlineBadgeInfo {
  urgency: DeadlineUrgency;
  label: string;
  dayDiff: number;
}

/**
 * Trả về nhãn thời hạn chuẩn xác theo múi giờ địa phương:
 * - Completed: Đã hoàn thành
 * - Overdue: Quá hạn (dayDiff < 0 hoặc trong ngày nhưng đã qua giờ hạn nộp)
 * - Due Today: Hạn hôm nay (dayDiff === 0)
 * - Due Tomorrow: Hạn ngày mai (dayDiff === 1)
 * - Upcoming: Còn X ngày (dayDiff > 1)
 */
export function getDeadlineBadgeInfo(
  dueAt: DateInput,
  status: AssignmentStatus,
  now: DateInput = new Date()
): DeadlineBadgeInfo {
  const dayDiff = getCalendarDayDiff(dueAt, now);

  if (status === 'completed') {
    return {
      urgency: 'completed',
      label: 'Completed · Đã xong',
      dayDiff,
    };
  }

  const dueTime = toValidDate(dueAt).getTime();
  const nowTime = toValidDate(now).getTime();

  if (dayDiff < 0 || (dayDiff === 0 && dueTime < nowTime)) {
    return {
      urgency: 'overdue',
      label: 'Overdue · Quá hạn',
      dayDiff,
    };
  }

  if (dayDiff === 0) {
    return {
      urgency: 'dueToday',
      label: 'Due Today · Hôm nay',
      dayDiff,
    };
  }

  if (dayDiff === 1) {
    return {
      urgency: 'dueTomorrow',
      label: 'Due Tomorrow · Ngày mai',
      dayDiff,
    };
  }

  return {
    urgency: 'upcoming',
    label: `Còn ${dayDiff} ngày`,
    dayDiff,
  };
}

/**
 * Định dạng giờ địa phương HH:mm (phục vụ cột Time của LessonCard từ Figma)
 */
export function formatLocalTime(dateInput: DateInput): string {
  const d = toValidDate(dateInput);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Định dạng ngày tháng địa phương DD/MM/YYYY HH:mm
 */
export function formatLocalDateTime(dateInput: DateInput): string {
  const d = toValidDate(dateInput);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const time = formatLocalTime(d);
  return `${dd}/${mm}/${yyyy} · ${time}`;
}

/**
 * Định dạng tiêu đề tháng/năm cho thanh lịch tuần (VD: "Tháng 10, 2026")
 */
export function formatMonthYearTitle(dateInput: DateInput): string {
  const d = toValidDate(dateInput);
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

/**
 * Module 6 (Bước 6.1 & 6.2): Dịch Vụ Thông Báo Cục Bộ & Deep Linking (Expo Notifications)
 * "Deadline reminders as local notifications; tapping one opens that assignment's detail screen directly"
 * - Khi bài tập được tạo mới hoặc cập nhật hạn nộp dueAt, hệ thống tự động lập lịch thông báo cục bộ
 *   kèm gói dữ liệu data: { assignmentId: id, url: `/assignment/${id}` }.
 * - Nếu bài tập được đánh dấu hoàn thành hoặc xóa, tự động hủy thông báo đã đặt lịch.
 * - Tích hợp hàm "Gửi thông báo nhắc thử sau 5 giây" giúp nhóm demo trực tiếp trước giảng viên.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Assignment } from '../types/domain';
import { formatLocalDateTime } from '../utils/dateUtils';

let handlerConfigured = false;

export function configureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') {
    return;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch {
    // Bỏ qua trong môi trường test Jest hoặc nền tảng không hỗ trợ
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(
      requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function cancelScheduledReminder(notificationId?: string): Promise<void> {
  if (!notificationId || Platform.OS === 'web') {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore if already fired or cancelled
  }
}

/**
 * Đặt lịch thông báo nhắc hạn tự động trước hạn nộp (hoặc vào đúng hạn nộp nếu còn ít thời gian)
 */
export async function scheduleAssignmentReminder(
  assignment: Assignment,
  courseName?: string
): Promise<string | undefined> {
  if (Platform.OS === 'web' || assignment.status === 'completed') {
    return undefined;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return undefined;
  }

  if (assignment.notificationId) {
    await cancelScheduledReminder(assignment.notificationId);
  }

  const dueMs = new Date(assignment.dueAt).getTime();
  const nowMs = Date.now();
  // Nhắc trước 1 giờ, hoặc nếu hạn nộp gần hơn 1 giờ thì nhắc sau 10 giây
  const oneHourBefore = dueMs - 60 * 60 * 1000;
  const triggerSeconds = Math.max(
    10,
    Math.round(((oneHourBefore > nowMs ? oneHourBefore : dueMs) - nowMs) / 1000)
  );

  if (dueMs <= nowMs) {
    return undefined;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Sắp đến hạn: ${assignment.title}`,
        body: `${courseName ? `[${courseName}] ` : ''}Hạn nộp: ${formatLocalDateTime(
          assignment.dueAt
        )}. Chạm để xem chi tiết!`,
        data: {
          assignmentId: assignment.id,
          url: `/assignment/${assignment.id}`,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        repeats: false,
      },
    });
    return id;
  } catch {
    return undefined;
  }
}

/**
 * Bước 6.2.1: Hàm "Gửi thông báo nhắc thử sau 5 giây" ngay trong màn hình chi tiết bài tập
 * Giúp nhóm demo trực tiếp cực nhanh trước giảng viên mà không phải chờ đến ngày mai.
 */
export async function scheduleDemoReminderIn5Seconds(
  assignment: Assignment,
  courseName?: string
): Promise<{ scheduled: boolean; notificationId?: string; message: string }> {
  if (Platform.OS === 'web') {
    return {
      scheduled: true,
      notificationId: `web-demo-${Date.now()}`,
      message: 'Đang chạy trên Web: Đã mô phỏng lịch nhắc sau 5 giây kèm Deep Link.',
    };
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return {
      scheduled: false,
      message: 'Chưa được cấp quyền Thông báo (Notifications). Vui lòng bật quyền trong Cài đặt.',
    };
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Nhắc hạn bài tập: ${assignment.title}`,
        body: `${courseName ? `[${courseName}] ` : ''}Hạn nộp ${formatLocalDateTime(
          assignment.dueAt
        )}. Chạm vào thông báo này để mở thẳng màn hình chi tiết!`,
        data: {
          assignmentId: assignment.id,
          url: `/assignment/${assignment.id}`,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });

    return {
      scheduled: true,
      notificationId: id,
      message: 'Đã lên lịch thông báo nhắc thử sau 5 giây! Hãy chờ thông báo xuất hiện và chạm vào.',
    };
  } catch {
    return {
      scheduled: false,
      message: 'Không thể gửi thông báo cục bộ trên thiết bị này.',
    };
  }
}

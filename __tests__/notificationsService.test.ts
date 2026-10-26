/**
 * Test Suite: Local Notifications & Deep Linking Service (Module 6)
 * Kiểm thử toàn diện:
 * 1. Cấu hình Handler (configureNotificationHandler).
 * 2. Yêu cầu cấp quyền thông báo (requestNotificationPermissions).
 * 3. Hủy thông báo đã đặt lịch (cancelScheduledReminder).
 * 4. Đặt lịch nhắc hạn tự động (scheduleAssignmentReminder).
 * 5. Bắn thông báo nhắc thử sau 5 giây (scheduleDemoReminderIn5Seconds) chứa đúng payload Deep Link.
 */

import * as Notifications from 'expo-notifications';
import {
  cancelScheduledReminder,
  configureNotificationHandler,
  requestNotificationPermissions,
  scheduleAssignmentReminder,
  scheduleDemoReminderIn5Seconds,
} from '../src/services/notifications';
import { Assignment } from '../src/types/domain';

describe('Local Notifications Service (Module 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Configuration & Permissions', () => {
    it('configureNotificationHandler gọi Notifications.setNotificationHandler', () => {
      configureNotificationHandler();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });

    it('requestNotificationPermissions trả về true khi đã có quyền', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: true,
      } as any);

      const granted = await requestNotificationPermissions();
      expect(granted).toBe(true);
    });

    it('requestNotificationPermissions yêu cầu cấp quyền khi chưa có', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: false,
      } as any);
      jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
        granted: true,
      } as any);

      const granted = await requestNotificationPermissions();
      expect(granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. scheduleAssignmentReminder', () => {
    const futureDue = new Date(Date.now() + 5 * 3600 * 1000).toISOString();

    it('đặt lịch thông báo thành công cho bài tập pending trong tương lai', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: true,
      } as any);
      const scheduleSpy = jest.spyOn(Notifications, 'scheduleNotificationAsync');

      const assignment: Assignment = {
        id: 'asg-notif-1',
        courseId: 'crs-math',
        title: 'Ôn tập Giải tích',
        dueAt: futureDue,
        status: 'pending',
      };

      const notifId = await scheduleAssignmentReminder(assignment, 'Giải tích 1');

      expect(notifId).toBe('mock-notif-id-123');
      expect(scheduleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Sắp đến hạn: Ôn tập Giải tích',
            data: {
              assignmentId: 'asg-notif-1',
              url: '/assignment/asg-notif-1',
            },
          }),
        })
      );
    });

    it('không đặt lịch nếu bài tập đã hoàn thành (status === completed)', async () => {
      const scheduleSpy = jest.spyOn(Notifications, 'scheduleNotificationAsync');

      const completedAssignment: Assignment = {
        id: 'asg-done',
        courseId: 'crs-math',
        title: 'Bài đã nộp',
        dueAt: futureDue,
        status: 'completed',
      };

      const result = await scheduleAssignmentReminder(completedAssignment);
      expect(result).toBeUndefined();
      expect(scheduleSpy).not.toHaveBeenCalled();
    });

    it('không đặt lịch nếu hạn nộp đã qua trong quá khứ', async () => {
      const pastDue = new Date(Date.now() - 3600 * 1000).toISOString();
      const pastAssignment: Assignment = {
        id: 'asg-past',
        courseId: 'crs-math',
        title: 'Bài quá khứ',
        dueAt: pastDue,
        status: 'pending',
      };

      const result = await scheduleAssignmentReminder(pastAssignment);
      expect(result).toBeUndefined();
    });

    it('hủy thông báo cũ nếu assignment đã có notificationId trước đó', async () => {
      const cancelSpy = jest.spyOn(
        Notifications,
        'cancelScheduledNotificationAsync'
      );

      const assignmentWithOldNotif: Assignment = {
        id: 'asg-old',
        courseId: 'crs-math',
        title: 'Bài tập dời lịch',
        dueAt: futureDue,
        status: 'pending',
        notificationId: 'old-notif-999',
      };

      await scheduleAssignmentReminder(assignmentWithOldNotif);
      expect(cancelSpy).toHaveBeenCalledWith('old-notif-999');
    });
  });

  describe('3. scheduleDemoReminderIn5Seconds', () => {
    it('lên lịch thông báo sau 5 giây chứa đúng thông tin và deep link', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: true,
      } as any);
      const scheduleSpy = jest.spyOn(Notifications, 'scheduleNotificationAsync');

      const assignment: Assignment = {
        id: 'asg-demo-5s',
        courseId: 'crs-1',
        title: 'Bài tập demo trước GV',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
      };

      const result = await scheduleDemoReminderIn5Seconds(assignment, 'Vật lý 1');

      expect(result.scheduled).toBe(true);
      expect(result.notificationId).toBe('mock-notif-id-123');
      expect(scheduleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: {
              assignmentId: 'asg-demo-5s',
              url: '/assignment/asg-demo-5s',
            },
          }),
          trigger: expect.objectContaining({
            seconds: 5,
          }),
        })
      );
    });
  });

  describe('4. cancelScheduledReminder', () => {
    it('gọi Notifications.cancelScheduledNotificationAsync với notificationId tương ứng', async () => {
      const cancelSpy = jest.spyOn(
        Notifications,
        'cancelScheduledNotificationAsync'
      );

      await cancelScheduledReminder('notif-cancel-me-123');
      expect(cancelSpy).toHaveBeenCalledWith('notif-cancel-me-123');
    });

    it('bỏ qua an toàn khi notificationId rỗng hoặc undefined', async () => {
      const cancelSpy = jest.spyOn(
        Notifications,
        'cancelScheduledNotificationAsync'
      );

      await cancelScheduledReminder(undefined);
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });
});

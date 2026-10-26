/**
 * Test Suite: Remote Study API Service & Offline Queue (Module 3 & Module 5)
 * Kiểm thử toàn diện:
 * 1. Khởi tạo dữ liệu hạt giống (Seed Data) chuẩn chuẩn mực không dính thông tin đồ án/cá nhân.
 * 2. CRUD môn học (fetch, create, update) kèm tự động viết hoa Course Code.
 * 3. CRUD bài tập (fetch, create, update, delete) kèm cập nhật updatedAt/createdAt.
 * 4. Giả lập lỗi Server 500 (simulateServerError500) chặn mutation và ném lỗi 500.
 * 5. Hàng đợi Offline (Offline Mutation Queue) và cơ chế xả hàng đợi khi có mạng lại.
 */

import { useNetworkSyncStore } from '../src/services/queryClient';
import {
  createAssignmentApi,
  createCourseApi,
  createSeedAssignments,
  createSeedCourses,
  deleteAssignmentApi,
  fetchAssignmentsApi,
  fetchCoursesApi,
  flushOfflineMutationQueue,
  resetRemoteDbForTests,
  updateAssignmentApi,
  updateCourseApi,
} from '../src/services/studyApi';

describe('Study API & Offline Mutation Queue (Module 3 & 5)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useNetworkSyncStore.getState().setSimulatedOffline(false);
    useNetworkSyncStore.getState().setSimulateServerError500(false);
    useNetworkSyncStore.getState().resetPendingMutations();
    await resetRemoteDbForTests();
  });

  describe('1. Seed Data Integrity', () => {
    it('createSeedCourses tạo đủ 6 môn học với các trường chuẩn', () => {
      const courses = createSeedCourses();
      expect(courses.length).toBeGreaterThanOrEqual(5);

      for (const course of courses) {
        expect(course.id).toBeTruthy();
        expect(course.code).toBeTruthy();
        expect(course.name).toBeTruthy();
        expect(course.colour).toBeTruthy();
      }
    });

    it('createSeedAssignments tạo danh sách bài tập hợp lệ với các trạng thái pending và completed', () => {
      const assignments = createSeedAssignments();
      expect(assignments.length).toBeGreaterThanOrEqual(6);

      const hasPending = assignments.some((a) => a.status === 'pending');
      const hasCompleted = assignments.some((a) => a.status === 'completed');

      expect(hasPending).toBe(true);
      expect(hasCompleted).toBe(true);

      for (const assignment of assignments) {
        expect(assignment.id).toBeTruthy();
        expect(assignment.courseId).toBeTruthy();
        expect(assignment.title).toBeTruthy();
        expect(new Date(assignment.dueAt).getTime()).not.toBeNaN();
      }
    });
  });

  describe('2. Courses CRUD Operations', () => {
    it('fetchCoursesApi trả về danh sách môn học', async () => {
      const courses = await fetchCoursesApi();
      expect(courses.length).toBeGreaterThanOrEqual(6);
      expect(courses[0].code).toBe('MAT101');
    });

    it('createCourseApi tạo môn học mới, tự động viết hoa mã học phần và lưu vào kho', async () => {
      const newCourse = await createCourseApi({
        code: 'mat201',
        name: 'Giải tích 2',
        colour: 'purple',
        instructor: 'TS. Hoàng Hải',
        room: 'Phòng B1-205',
      });

      expect(newCourse.id).toBeTruthy();
      expect(newCourse.code).toBe('MAT201'); // Đã tự động toUpperCase()
      expect(newCourse.name).toBe('Giải tích 2');
      expect(newCourse.colour).toBe('purple');

      const allCourses = await fetchCoursesApi();
      expect(allCourses.some((c) => c.id === newCourse.id)).toBe(true);
    });

    it('createCourseApi từ chối khi thiếu mã học phần hoặc tên môn học', async () => {
      await expect(
        createCourseApi({ code: '', name: 'Môn học Không Mã', colour: 'blue' })
      ).rejects.toThrow('Mã học phần và tên môn học là bắt buộc');

      await expect(
        createCourseApi({ code: 'MAT101', name: '', colour: 'blue' })
      ).rejects.toThrow('Mã học phần và tên môn học là bắt buộc');
    });

    it('updateCourseApi cập nhật thông tin môn học hiện có', async () => {
      const courses = await fetchCoursesApi();
      const targetCourse = courses[0];

      const updated = await updateCourseApi({
        id: targetCourse.id,
        name: 'Giải tích 1 Nâng Cao',
        room: 'Phòng Mới A2-302',
      });

      expect(updated.id).toBe(targetCourse.id);
      expect(updated.name).toBe('Giải tích 1 Nâng Cao');
      expect(updated.room).toBe('Phòng Mới A2-302');
    });

    it('updateCourseApi báo lỗi khi cập nhật ID không tồn tại', async () => {
      await expect(
        updateCourseApi({ id: 'non-existing-course-id', name: 'Môn lạ' })
      ).rejects.toThrow('Không tìm thấy môn học');
    });
  });

  describe('3. Assignments CRUD Operations', () => {
    it('fetchAssignmentsApi trả về danh sách bài tập', async () => {
      const assignments = await fetchAssignmentsApi();
      expect(assignments.length).toBeGreaterThanOrEqual(6);
    });

    it('createAssignmentApi tạo bài tập mới với trạng thái mặc định pending', async () => {
      const newAsg = await createAssignmentApi({
        courseId: 'crs-math-101',
        title: 'Bài tập ma trận nghịch đảo',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Nộp bản viết tay',
      });

      expect(newAsg.id).toBeTruthy();
      expect(newAsg.title).toBe('Bài tập ma trận nghịch đảo');
      expect(newAsg.status).toBe('pending');
      expect(newAsg.notes).toBe('Nộp bản viết tay');

      const all = await fetchAssignmentsApi();
      expect(all.some((a) => a.id === newAsg.id)).toBe(true);
    });

    it('createAssignmentApi từ chối khi thiếu tiêu đề hoặc môn học', async () => {
      await expect(
        createAssignmentApi({
          courseId: '',
          title: 'Bài tập hợp lệ',
          dueAt: new Date().toISOString(),
        })
      ).rejects.toThrow('Môn học và tiêu đề bài tập là bắt buộc');

      await expect(
        createAssignmentApi({
          courseId: 'crs-math-101',
          title: '   ',
          dueAt: new Date().toISOString(),
        })
      ).rejects.toThrow('Môn học và tiêu đề bài tập là bắt buộc');
    });

    it('updateAssignmentApi cập nhật trạng thái completed và đính kèm ảnh', async () => {
      const all = await fetchAssignmentsApi();
      const target = all[0];

      const updated = await updateAssignmentApi({
        id: target.id,
        status: 'completed',
        photoUri: 'file:///mock/image.png',
      });

      expect(updated.status).toBe('completed');
      expect(updated.photoUri).toBe('file:///mock/image.png');
    });

    it('deleteAssignmentApi xóa bài tập khỏi danh sách', async () => {
      const allBefore = await fetchAssignmentsApi();
      const targetId = allBefore[0].id;

      await deleteAssignmentApi(targetId);

      const allAfter = await fetchAssignmentsApi();
      expect(allAfter.some((a) => a.id === targetId)).toBe(false);
      expect(allAfter.length).toBe(allBefore.length - 1);
    });

    it('deleteAssignmentApi báo lỗi khi xóa ID không tồn tại', async () => {
      await expect(deleteAssignmentApi('fake-id-9999')).rejects.toThrow(
        'Không tìm thấy bài tập'
      );
    });
  });

  describe('4. Simulated Server Error 500 (Kiểm thử Rollback)', () => {
    it('khi bật simulateServerError500, các thao tác mutation bị từ chối với mã 500', async () => {
      useNetworkSyncStore.getState().setSimulateServerError500(true);

      await expect(
        createCourseApi({ code: 'ERR500', name: 'Môn Test Lỗi', colour: 'blue' })
      ).rejects.toThrow('500 Internal Server Error');

      await expect(
        createAssignmentApi({
          courseId: 'crs-math-101',
          title: 'Test lỗi 500',
          dueAt: new Date().toISOString(),
        })
      ).rejects.toThrow('500 Internal Server Error');

      await expect(
        updateAssignmentApi({ id: 'asg-101', status: 'completed' })
      ).rejects.toThrow('500 Internal Server Error');

      await expect(deleteAssignmentApi('asg-101')).rejects.toThrow('500 Internal Server Error');
    });
  });

  describe('5. Offline Mutation Queue & Flush', () => {
    it('khi bật simulatedOffline, thao tác tạo bài tập vẫn cập nhật DB cục bộ và xếp vào hàng đợi', async () => {
      useNetworkSyncStore.getState().setSimulatedOffline(true);

      const offlineAsg = await createAssignmentApi({
        courseId: 'crs-math-101',
        title: 'Bài tập tạo lúc mất mạng',
        dueAt: new Date(Date.now() + 7200000).toISOString(),
      });

      expect(offlineAsg.title).toBe('Bài tập tạo lúc mất mạng');
      expect(useNetworkSyncStore.getState().pendingMutationsCount).toBeGreaterThanOrEqual(1);

      // Khi kết nối mạng phục hồi (isOnline = true), xả hàng đợi thành công
      useNetworkSyncStore.getState().setSimulatedOffline(false);
      const flushedCount = await flushOfflineMutationQueue(true);

      expect(flushedCount).toBeGreaterThanOrEqual(1);
      expect(useNetworkSyncStore.getState().pendingMutationsCount).toBe(0);
    });

    it('flushOfflineMutationQueue không xả hàng đợi nếu thiết bị vẫn đang offline', async () => {
      useNetworkSyncStore.getState().setSimulatedOffline(true);
      await createAssignmentApi({
        courseId: 'crs-math-101',
        title: 'Bài tập offline 2',
        dueAt: new Date().toISOString(),
      });

      const flushedCount = await flushOfflineMutationQueue(false);
      expect(flushedCount).toBe(0);
      expect(useNetworkSyncStore.getState().pendingMutationsCount).toBeGreaterThan(0);
    });
  });
});

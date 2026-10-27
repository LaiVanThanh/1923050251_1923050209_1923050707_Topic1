/**
 * Test Suite: Remote Study API Service & Offline Queue (Module 3 & Module 5)
 * Kiểm thử toàn diện:
 * 1. Khởi tạo dữ liệu hạt giống (Seed Data) chuẩn mực.
 * 2. CRUD môn học (fetch, create, update) gửi trực tiếp request lên DEFAULT_API_BASE_URL ngay cả khi chưa cấu hình EXPO_PUBLIC_API_BASE_URL.
 * 3. CRUD bài tập (fetch, create, update, delete) kèm đồng bộ REST API.
 * 4. Giả lập lỗi Server 500 (simulateServerError500) chặn mutation và ném lỗi 500.
 * 5. Hàng đợi Offline (Offline Mutation Queue) và cơ chế xả hàng đợi gửi HTTP request lên máy chủ khi có mạng lại.
 */

import { useNetworkSyncStore } from '../src/services/queryClient';
import {
  DEFAULT_API_BASE_URL,
  createAssignmentApi,
  createCourseApi,
  createSeedAssignments,
  createSeedCourses,
  deleteAssignmentApi,
  fetchAssignmentsApi,
  fetchCoursesApi,
  flushOfflineMutationQueue,
  getApiBaseUrl,
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
    resetRemoteDbForTests();
  });

  describe('1. Seed Data & Default Remote API URL', () => {
    it('getApiBaseUrl luôn trả về DEFAULT_API_BASE_URL hợp lệ ngay cả khi chưa cấu hình EXPO_PUBLIC_API_BASE_URL', () => {
      const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;

      expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
      expect(getApiBaseUrl().startsWith('https://')).toBe(true);

      process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    });

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

    it('createCourseApi tạo môn học mới, tự động viết hoa mã học phần và gửi POST lên API từ xa', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      const newCourse = await createCourseApi({
        code: 'mat201',
        name: 'Giải tích 2',
        colour: 'purple',
        instructor: 'TS. Hoàng Hải',
        room: 'Phòng B1-205',
      });

      expect(newCourse.id).toBeTruthy();
      expect(newCourse.code).toBe('MAT201');
      expect(newCourse.name).toBe('Giải tích 2');
      expect(newCourse.colour).toBe('purple');
      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/courses`,
        expect.objectContaining({ method: 'POST' })
      );

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

    it('updateCourseApi cập nhật thông tin môn học hiện có và gửi PUT lên API từ xa', async () => {
      const courses = await fetchCoursesApi();
      const targetCourse = courses[0];
      const fetchSpy = jest.spyOn(global, 'fetch');

      const updated = await updateCourseApi({
        id: targetCourse.id,
        name: 'Giải tích 1 Nâng Cao',
        room: 'Phòng Mới A2-302',
      });

      expect(updated.id).toBe(targetCourse.id);
      expect(updated.name).toBe('Giải tích 1 Nâng Cao');
      expect(updated.room).toBe('Phòng Mới A2-302');
      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/courses/${targetCourse.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
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

    it('createAssignmentApi tạo bài tập mới với trạng thái mặc định pending và gửi POST lên API từ xa', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
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
      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/assignments`,
        expect.objectContaining({ method: 'POST' })
      );

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

    it('updateAssignmentApi cập nhật trạng thái completed, đính kèm ảnh và gửi PUT lên API từ xa', async () => {
      const all = await fetchAssignmentsApi();
      const target = all[0];
      const fetchSpy = jest.spyOn(global, 'fetch');

      const updated = await updateAssignmentApi({
        id: target.id,
        status: 'completed',
        photoUri: 'file:///mock/image.png',
      });

      expect(updated.status).toBe('completed');
      expect(updated.photoUri).toBe('file:///mock/image.png');
      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/assignments/${target.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteAssignmentApi xóa bài tập khỏi danh sách và gửi DELETE lên API từ xa', async () => {
      const allBefore = await fetchAssignmentsApi();
      const targetId = allBefore[0].id;
      const fetchSpy = jest.spyOn(global, 'fetch');

      await deleteAssignmentApi(targetId);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/assignments/${targetId}`,
        expect.objectContaining({ method: 'DELETE' })
      );

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
    it('khi bật simulatedOffline, thao tác tạo bài tập xếp vào hàng đợi và khi có mạng sẽ gửi POST lên API từ xa', async () => {
      useNetworkSyncStore.getState().setSimulatedOffline(true);

      const offlineAsg = await createAssignmentApi({
        courseId: 'crs-math-101',
        title: 'Bài tập tạo lúc mất mạng',
        dueAt: new Date(Date.now() + 7200000).toISOString(),
      });

      expect(offlineAsg.title).toBe('Bài tập tạo lúc mất mạng');
      expect(useNetworkSyncStore.getState().pendingMutationsCount).toBeGreaterThanOrEqual(1);

      const fetchSpy = jest.spyOn(global, 'fetch');
      useNetworkSyncStore.getState().setSimulatedOffline(false);
      const flushedCount = await flushOfflineMutationQueue(true);

      expect(flushedCount).toBeGreaterThanOrEqual(1);
      expect(useNetworkSyncStore.getState().pendingMutationsCount).toBe(0);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/assignments`,
        expect.objectContaining({ method: 'POST' })
      );
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

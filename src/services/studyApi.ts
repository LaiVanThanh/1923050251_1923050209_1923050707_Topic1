/**
 * Module 3 (Bước 3.1) & Module 5 (Bước 5.1): Remote API Service & Offline Queue
 * - Quản lý 2 nhánh tài nguyên: /courses (chứa sẵn 6 môn học mẫu học kỳ của sinh viên) và /assignments.
 * - Hỗ trợ kết nối Remote REST API (qua biến môi trường EXPO_PUBLIC_API_BASE_URL)
 *   kèm Remote Store đồng bộ và Persistence xuống thiết bị để hoạt động mượt mà cả Online lẫn Offline.
 * - Hỗ trợ giả lập lỗi 500 (simulateServerError500) để kiểm thử & demo trực tiếp Optimistic Rollback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Assignment,
  Course,
  CreateAssignmentInput,
  CreateCourseInput,
  UpdateAssignmentInput,
  UpdateCourseInput,
} from '../types/domain';
import { saveOfflineSnapshot, useNetworkSyncStore } from './queryClient';

const REMOTE_DB_STORAGE_KEY = 'study_planner_remote_db_v1';
const OFFLINE_MUTATION_QUEUE_KEY = 'study_planner_mutation_queue_v1';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://6723223149342416.mockapi.io/api/v1';

export interface QueuedMutationItem {
  id: string;
  type: 'CREATE_COURSE' | 'UPDATE_COURSE' | 'CREATE_ASSIGNMENT' | 'UPDATE_ASSIGNMENT' | 'DELETE_ASSIGNMENT';
  payload: unknown;
  createdAt: string;
}

/**
 * Tạo mốc thời gian tương đối so với thời điểm hiện tại theo giờ địa phương
 * để dữ liệu mẫu luôn hiển thị sinh động trong Widget 48h, Hôm nay, Ngày mai, Tuần này.
 */
function buildRelativeLocalIso(dayOffset: number, hour: number, minute = 0): string {
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    hour,
    minute,
    0,
    0
  );
  return target.toISOString();
}

export function createSeedCourses(): Course[] {
  return [
    {
      id: 'crs-mobile-101',
      code: 'TH7011101',
      name: 'Lập trình Mobile (React Native)',
      colour: 'blue',
      instructor: 'GV. Khoa CNTT',
      room: 'Phòng Lab B3-204',
    },
    {
      id: 'crs-sad-102',
      code: 'TH7011205',
      name: 'Phân tích & Thiết kế HTTT',
      colour: 'indigo',
      instructor: 'ThS. Nguyễn Văn An',
      room: 'Giảng đường A2-105',
    },
    {
      id: 'crs-db-103',
      code: 'TH7011108',
      name: 'Hệ quản trị Cơ sở Dữ liệu',
      colour: 'teal',
      instructor: 'ThS. Trần Thị Bình',
      room: 'Phòng Lab B2-301',
    },
    {
      id: 'crs-ai-104',
      code: 'TH7011302',
      name: 'Trí tuệ Nhân tạo & Ứng dụng',
      colour: 'purple',
      instructor: 'TS. Lê Hoàng Nam',
      room: 'Phòng A3-402',
    },
    {
      id: 'crs-sec-105',
      code: 'TH7011409',
      name: 'An toàn & Bảo mật Thông tin',
      colour: 'green',
      instructor: 'ThS. Phạm Minh Tuấn',
      room: 'Phòng B1-102',
    },
    {
      id: 'crs-pm-106',
      code: 'TH7011501',
      name: 'Quản lý Dự án Phần mềm',
      colour: 'orange',
      instructor: 'ThS. Vũ Quốc Khánh',
      room: 'Phòng A1-208',
    },
  ];
}

export function createSeedAssignments(): Assignment[] {
  const now = new Date();
  const in6Hours = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();
  const in20Hours = new Date(now.getTime() + 20 * 3600 * 1000).toISOString();

  return [
    {
      id: 'asg-101',
      courseId: 'crs-mobile-101',
      title: 'Hoàn thiện 6 Module đồ án Study Planner (Topic 01)',
      dueAt: in6Hours,
      status: 'pending',
      notes:
        'Đảm bảo đủ 4 trạng thái (Loading, Empty, Error + Retry, Content), 0 mã màu hex ngoài tokens.ts và kiểm tra múi giờ 23:30 vs 08:00.',
    },
    {
      id: 'asg-102',
      courseId: 'crs-sad-102',
      title: 'Đặc tả Use Case & Sơ đồ tuần tự luồng Offline Optimistic UI',
      dueAt: in20Hours,
      status: 'pending',
      notes:
        'Vẽ sơ đồ Sequence Diagram cho luồng onMutate -> onError rollback -> onSettled với TanStack Query.',
    },
    {
      id: 'asg-103',
      courseId: 'crs-db-103',
      title: 'Tối ưu hóa truy vấn SQL & Thiết kế Schema không lưu tiến độ tĩnh',
      dueAt: buildRelativeLocalIso(1, 16, 30),
      status: 'pending',
      notes:
        'Chứng minh công thức tính động Completed vs Outstanding từ bảng Assignments thay vì tạo cột dư thừa.',
    },
    {
      id: 'asg-104',
      courseId: 'crs-pm-106',
      title: 'Báo cáo điều phối tiến độ 5 ngày & Giải thích code chéo (Viva)',
      dueAt: buildRelativeLocalIso(2, 14, 0),
      status: 'pending',
      notes:
        'Tổ chức buổi Cross-Code Walkthrough 90 phút để cả 3 thành viên 1923050251, 1923050209, 1923050707 nắm vững toàn bộ 6 module.',
    },
    {
      id: 'asg-105',
      courseId: 'crs-sec-105',
      title: 'Kiểm thử lưu trữ phiên đăng nhập bằng Expo SecureStore',
      dueAt: buildRelativeLocalIso(-1, 21, 0),
      status: 'completed',
      notes:
        'Đã kiểm chứng Force Quit mở lại vẫn giữ phiên và Sign Out xóa sạch token kèm queryClient.clear().',
    },
    {
      id: 'asg-106',
      courseId: 'crs-ai-104',
      title: 'Viết nhật ký AI_LOG.md & Bản phản tư One-page Reflection',
      dueAt: buildRelativeLocalIso(3, 18, 0),
      status: 'pending',
      notes:
        'Phân tích lỗi AI dùng toISOString() gây lệch ngày ở múi giờ Việt Nam UTC+7 và cách khắc phục bằng startOfLocalDay.',
    },
    {
      id: 'asg-107',
      courseId: 'crs-mobile-101',
      title: 'Thiết lập bảng màu Light/Dark từ Figma UI Kit & kiểm tra độ tương phản',
      dueAt: buildRelativeLocalIso(-2, 10, 0),
      status: 'completed',
      notes: 'Tất cả màu chữ thân bài đạt tỷ lệ tương phản >= 4.5:1 theo chuẩn WCAG AA.',
    },
  ];
}

interface RemoteDatabaseState {
  courses: Course[];
  assignments: Assignment[];
}

let inMemoryRemoteDb: RemoteDatabaseState | null = null;

async function getRemoteDb(): Promise<RemoteDatabaseState> {
  if (inMemoryRemoteDb) {
    return inMemoryRemoteDb;
  }
  try {
    const raw = await AsyncStorage.getItem(REMOTE_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RemoteDatabaseState;
      if (Array.isArray(parsed.courses) && Array.isArray(parsed.assignments)) {
        inMemoryRemoteDb = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data
  }

  inMemoryRemoteDb = {
    courses: createSeedCourses(),
    assignments: createSeedAssignments(),
  };
  try {
    await AsyncStorage.setItem(REMOTE_DB_STORAGE_KEY, JSON.stringify(inMemoryRemoteDb));
  } catch {
    // Ignore storage write error in test environment
  }
  return inMemoryRemoteDb;
}

async function persistRemoteDb(db: RemoteDatabaseState): Promise<void> {
  inMemoryRemoteDb = db;
  try {
    await AsyncStorage.setItem(REMOTE_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage write error
  }
}

export async function enqueueOfflineMutation(
  type: QueuedMutationItem['type'],
  payload: unknown
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    const queue: QueuedMutationItem[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(queue));
    useNetworkSyncStore.getState().incrementPendingMutations();
  } catch {
    useNetworkSyncStore.getState().incrementPendingMutations();
  }
}

export async function flushOfflineMutationQueue(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    if (!raw) return 0;
    const queue: QueuedMutationItem[] = JSON.parse(raw);
    if (API_BASE_URL && queue.length > 0) {
      for (const item of queue) {
        try {
          if (item.type === 'CREATE_COURSE') {
            await fetch(`${API_BASE_URL}/courses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
          } else if (item.type === 'UPDATE_COURSE') {
            const payload = item.payload as { id: string };
            await fetch(`${API_BASE_URL}/courses/${payload.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
          } else if (item.type === 'CREATE_ASSIGNMENT') {
            await fetch(`${API_BASE_URL}/assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
          } else if (item.type === 'UPDATE_ASSIGNMENT') {
            const payload = item.payload as { id: string };
            await fetch(`${API_BASE_URL}/assignments/${payload.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
          } else if (item.type === 'DELETE_ASSIGNMENT') {
            const payload = item.payload as { id: string };
            await fetch(`${API_BASE_URL}/assignments/${payload.id}`, {
              method: 'DELETE',
            });
          }
        } catch {
          // Tiếp tục đồng bộ các mục khác trong hàng đợi
        }
      }
    }
    await AsyncStorage.removeItem(OFFLINE_MUTATION_QUEUE_KEY);
    useNetworkSyncStore.getState().resetPendingMutations();
    return queue.length;
  } catch {
    useNetworkSyncStore.getState().resetPendingMutations();
    return 0;
  }
}

function assertServerHealthy(): void {
  const { simulateServerError500 } = useNetworkSyncStore.getState();
  if (simulateServerError500) {
    throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật (Giả lập lỗi 500 để kiểm chứng Rollback).');
  }
}

/**
 * GET /courses
 */
export async function fetchCoursesApi(): Promise<Course[]> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (response.ok) {
        const remoteCourses = (await response.json()) as Course[];
        const db = await getRemoteDb();
        await persistRemoteDb({ ...db, courses: remoteCourses });
        await saveOfflineSnapshot(remoteCourses, db.assignments);
        return remoteCourses;
      }
    } catch {
      // Fallback to local persisted remote DB
    }
  }

  const db = await getRemoteDb();
  if (!effectivelyOffline) {
    await flushOfflineMutationQueue();
    await saveOfflineSnapshot(db.courses, db.assignments);
  }
  return [...db.courses];
}

/**
 * GET /assignments
 */
export async function fetchAssignmentsApi(): Promise<Assignment[]> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`);
      if (response.ok) {
        const remoteAssignments = (await response.json()) as Assignment[];
        const db = await getRemoteDb();
        await persistRemoteDb({ ...db, assignments: remoteAssignments });
        await saveOfflineSnapshot(db.courses, remoteAssignments);
        return remoteAssignments;
      }
    } catch {
      // Fallback to local persisted remote DB
    }
  }

  const db = await getRemoteDb();
  if (!effectivelyOffline) {
    await flushOfflineMutationQueue();
    await saveOfflineSnapshot(db.courses, db.assignments);
  }
  return [...db.assignments];
}

/**
 * POST /courses
 */
export async function createCourseApi(input: CreateCourseInput): Promise<Course> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  const newCourse: Course = {
    id: `crs-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    colour: input.colour,
    instructor: input.instructor?.trim() || 'GV. Học phần',
    room: input.room?.trim() || 'Phòng học DNTU',
  };

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      if (response.ok) {
        const remoteCreated = (await response.json()) as Course;
        if (remoteCreated && remoteCreated.id) {
          newCourse.id = remoteCreated.id;
        }
      } else if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối tạo môn học.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('CREATE_COURSE', newCourse);
    }
  } else if (effectivelyOffline) {
    await enqueueOfflineMutation('CREATE_COURSE', newCourse);
  }

  const db = await getRemoteDb();
  const nextCourses = [...db.courses, newCourse];
  await persistRemoteDb({ ...db, courses: nextCourses });
  await saveOfflineSnapshot(nextCourses, db.assignments);

  return newCourse;
}

/**
 * PUT /courses/:id
 */
export async function updateCourseApi(input: UpdateCourseInput): Promise<Course> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  const db = await getRemoteDb();
  const existingIndex = db.courses.findIndex((c) => c.id === input.id);
  if (existingIndex === -1) {
    throw new Error('Không tìm thấy môn học cần cập nhật.');
  }

  const updatedCourse: Course = {
    ...db.courses[existingIndex],
    ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.colour !== undefined ? { colour: input.colour } : {}),
    ...(input.instructor !== undefined ? { instructor: input.instructor.trim() } : {}),
    ...(input.room !== undefined ? { room: input.room.trim() } : {}),
  };

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourse),
      });
      if (!response.ok && response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật môn học.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('UPDATE_COURSE', updatedCourse);
    }
  } else if (effectivelyOffline) {
    await enqueueOfflineMutation('UPDATE_COURSE', updatedCourse);
  }

  const nextCourses = [...db.courses];
  nextCourses[existingIndex] = updatedCourse;
  await persistRemoteDb({ ...db, courses: nextCourses });
  await saveOfflineSnapshot(nextCourses, db.assignments);

  return updatedCourse;
}

/**
 * POST /assignments
 */
export async function createAssignmentApi(input: CreateAssignmentInput): Promise<Assignment> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  const newAssignment: Assignment = {
    id: `asg-${Date.now()}`,
    courseId: input.courseId,
    title: input.title.trim(),
    dueAt: input.dueAt,
    status: 'pending',
    notes: input.notes?.trim() || undefined,
    photoUri: input.photoUri,
  };

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      });
      if (response.ok) {
        const remoteCreated = (await response.json()) as Assignment;
        if (remoteCreated && remoteCreated.id) {
          newAssignment.id = remoteCreated.id;
        }
      } else if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối tạo bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('CREATE_ASSIGNMENT', newAssignment);
    }
  } else if (effectivelyOffline) {
    await enqueueOfflineMutation('CREATE_ASSIGNMENT', newAssignment);
  }

  const db = await getRemoteDb();
  const nextAssignments = [newAssignment, ...db.assignments];
  await persistRemoteDb({ ...db, assignments: nextAssignments });
  await saveOfflineSnapshot(db.courses, nextAssignments);

  return newAssignment;
}

/**
 * PUT /assignments/:id
 */
export async function updateAssignmentApi(input: UpdateAssignmentInput): Promise<Assignment> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  const db = await getRemoteDb();
  const existingIndex = db.assignments.findIndex((a) => a.id === input.id);
  if (existingIndex === -1) {
    throw new Error('Không tìm thấy bài tập cần cập nhật.');
  }

  const current = db.assignments[existingIndex];
  const updatedAssignment: Assignment = {
    ...current,
    ...(input.courseId !== undefined ? { courseId: input.courseId } : {}),
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.photoUri !== undefined ? { photoUri: input.photoUri } : {}),
    ...(input.notificationId !== undefined ? { notificationId: input.notificationId } : {}),
  };

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${updatedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment),
      });
      if (!response.ok && response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('UPDATE_ASSIGNMENT', updatedAssignment);
    }
  } else if (effectivelyOffline) {
    await enqueueOfflineMutation('UPDATE_ASSIGNMENT', updatedAssignment);
  }

  const nextAssignments = [...db.assignments];
  nextAssignments[existingIndex] = updatedAssignment;
  await persistRemoteDb({ ...db, assignments: nextAssignments });
  await saveOfflineSnapshot(db.courses, nextAssignments);

  return updatedAssignment;
}

/**
 * DELETE /assignments/:id
 */
export async function deleteAssignmentApi(assignmentId: string): Promise<void> {
  assertServerHealthy();
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;

  if (!effectivelyOffline && API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối xóa bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('DELETE_ASSIGNMENT', { id: assignmentId });
    }
  } else if (effectivelyOffline) {
    await enqueueOfflineMutation('DELETE_ASSIGNMENT', { id: assignmentId });
  }

  const db = await getRemoteDb();
  const nextAssignments = db.assignments.filter((a) => a.id !== assignmentId);
  await persistRemoteDb({ ...db, assignments: nextAssignments });
  await saveOfflineSnapshot(db.courses, nextAssignments);
}

/**
 * Hàm phục vụ kiểm thử (Unit/Critical Path Test): đặt lại dữ liệu về trạng thái mẫu
 */
export function resetRemoteDbForTests(customData?: RemoteDatabaseState): void {
  inMemoryRemoteDb = customData ?? {
    courses: createSeedCourses(),
    assignments: createSeedAssignments(),
  };
}

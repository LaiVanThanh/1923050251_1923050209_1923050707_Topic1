/**
 * Module 3 & Module 5: Remote API Service & Offline Queue
 * - Quản lý 2 nhánh tài nguyên REST: /courses và /assignments.
 * - Luôn có địa chỉ máy chủ REST API mặc định (DEFAULT_API_BASE_URL) ngay cả khi chưa cấu hình biến môi trường EXPO_PUBLIC_API_BASE_URL.
 * - Khi đang Online: gửi trực tiếp các thao tác GET / POST / PUT / DELETE lên máy chủ từ xa qua fetch().
 * - Khi đang Offline: lưu vào AsyncStorage và đẩy vào hàng đợi Offline Mutation Queue.
 * - Khi mạng kết nối trở lại: tự động xả hàng đợi (flushOfflineMutationQueue) gửi toàn bộ thay đổi lên máy chủ từ xa.
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
import { queryClient, saveOfflineSnapshot, useNetworkSyncStore } from './queryClient';

const REMOTE_DB_STORAGE_KEY = 'study_planner_remote_db_v1';
const OFFLINE_MUTATION_QUEUE_KEY = 'study_planner_mutation_queue_v1';

export const DEFAULT_API_BASE_URL =
  'https://my-json-server.typicode.com/LaiVanThanh/1923050251_1923050209_1923050707_Topic1';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return (envUrl && envUrl.length > 0 ? envUrl : DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export interface QueuedMutationItem {
  id: string;
  type:
    | 'CREATE_COURSE'
    | 'UPDATE_COURSE'
    | 'CREATE_ASSIGNMENT'
    | 'UPDATE_ASSIGNMENT'
    | 'DELETE_ASSIGNMENT';
  payload: unknown;
  createdAt: string;
}

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
      id: 'crs-math-101',
      code: 'MAT101',
      name: 'Giải tích 1',
      colour: 'blue',
      instructor: 'TS. Nguyễn Văn Nam',
      room: 'Phòng A1-101',
    },
    {
      id: 'crs-phy-102',
      code: 'PHY102',
      name: 'Vật lý đại cương',
      colour: 'indigo',
      instructor: 'ThS. Trần Thị Mai',
      room: 'Phòng B2-203',
    },
    {
      id: 'crs-eng-103',
      code: 'ENG103',
      name: 'Tiếng Anh học thuật',
      colour: 'teal',
      instructor: 'Cô Jessica Brown',
      room: 'Phòng C1-305',
    },
    {
      id: 'crs-prog-104',
      code: 'PRO104',
      name: 'Nhập môn lập trình',
      colour: 'purple',
      instructor: 'ThS. Lê Hoàng Tuấn',
      room: 'Phòng Lab 2',
    },
    {
      id: 'crs-hist-105',
      code: 'HIS105',
      name: 'Lịch sử văn minh',
      colour: 'green',
      instructor: 'TS. Phạm Quốc Huy',
      room: 'Hội trường C',
    },
    {
      id: 'crs-eco-106',
      code: 'ECO106',
      name: 'Kinh tế vi mô',
      colour: 'orange',
      instructor: 'ThS. Đỗ Thu Hà',
      room: 'Phòng A2-204',
    },
    {
      id: 'quamon',
      code: 'ECO105',
      name: 'Kinh tế ',
      colour: 'orange',
      instructor: 'ThS. Đỗ ',
      room: 'Phòng A2-204',
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
      courseId: 'crs-math-101',
      title: 'Bài tập Giải tích chương 2',
      dueAt: in6Hours,
      status: 'pending',
      notes: 'Làm các bài tập 2.1 đến 2.15 trong giáo trình.',
    },
    {
      id: 'asg-102',
      courseId: 'crs-phy-102',
      title: 'Báo cáo thực hành thí nghiệm số 1',
      dueAt: in20Hours,
      status: 'pending',
      notes: 'Tính toán sai số và vẽ đồ thị dao động.',
    },
    {
      id: 'asg-103',
      courseId: 'crs-eng-103',
      title: 'Viết bài luận ngắn Academic Essay',
      dueAt: buildRelativeLocalIso(1, 16, 30),
      status: 'pending',
      notes: 'Chủ đề môi trường, độ dài từ 250 đến 300 từ.',
    },
    {
      id: 'asg-104',
      courseId: 'crs-prog-104',
      title: 'Bài tập thực hành Mảng và Chuỗi',
      dueAt: buildRelativeLocalIso(2, 14, 0),
      status: 'pending',
      notes: 'Hoàn thành các bài tập trên hệ thống nộp bài.',
    },
    {
      id: 'asg-105',
      courseId: 'crs-hist-105',
      title: 'Đọc tài liệu chuẩn bị thảo luận nhóm',
      dueAt: buildRelativeLocalIso(-1, 21, 0),
      status: 'completed',
      notes: 'Chuẩn bị nội dung cho buổi thảo luận trên lớp.',
    },
    {
      id: 'asg-106',
      courseId: 'crs-eco-106',
      title: 'Phân tích tình huống Cung - Cầu',
      dueAt: buildRelativeLocalIso(3, 18, 0),
      status: 'pending',
      notes: 'Tìm ví dụ thực tế về biến động giá hàng hóa.',
    },
    {
      id: 'asg-107',
      courseId: 'crs-math-101',
      title: 'Ôn tập ma trận và hệ phương trình',
      dueAt: buildRelativeLocalIso(-2, 10, 0),
      status: 'completed',
      notes: 'Xem lại lý thuyết và các dạng bài tập mẫu.',
    },
    {
      id: 'quamon',
      courseId: 'quamon',
      title: 'Ôn tập ma trận ',
      dueAt: buildRelativeLocalIso(-3, 10, 0),
      status: 'completed',
      notes: 'Xem lại lý thuyết và các dạng bài tập mẫu.',
    }
  ];
}

interface RemoteDatabaseState {
  courses: Course[];
  assignments: Assignment[];
  deletedAssignmentIds?: string[];
  hasLocalEdits?: boolean;
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
    deletedAssignmentIds: [],
    hasLocalEdits: false,
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

async function sendQueuedMutationToServer(
  baseUrl: string,
  item: QueuedMutationItem
): Promise<boolean> {
  try {
    let response: Response;
    if (item.type === 'CREATE_COURSE') {
      response = await fetch(`${baseUrl}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
    } else if (item.type === 'UPDATE_COURSE') {
      const payload = item.payload as { id: string };
      response = await fetch(`${baseUrl}/courses/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
    } else if (item.type === 'CREATE_ASSIGNMENT') {
      response = await fetch(`${baseUrl}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
    } else if (item.type === 'UPDATE_ASSIGNMENT') {
      const payload = item.payload as { id: string };
      response = await fetch(`${baseUrl}/assignments/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
    } else {
      const payload = item.payload as { id: string };
      response = await fetch(`${baseUrl}/assignments/${payload.id}`, {
        method: 'DELETE',
      });
    }
    return response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Xả hàng đợi Offline Mutation Queue lên máy chủ từ xa (getApiBaseUrl()) ngay khi có mạng.
 * Các mục gửi thành công sẽ được xóa khỏi hàng đợi; các mục lỗi mạng sẽ được giữ lại để thử lại.
 */
export async function flushOfflineMutationQueue(forceOnline?: boolean): Promise<number> {
  try {
    const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
    const effectivelyOffline =
      forceOnline !== undefined ? !forceOnline : !isOnline || simulatedOffline;
    if (effectivelyOffline) {
      return 0;
    }

    const raw = await AsyncStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    if (!raw) {
      useNetworkSyncStore.getState().resetPendingMutations();
      return 0;
    }

    const queue: QueuedMutationItem[] = JSON.parse(raw);
    if (queue.length === 0) {
      await AsyncStorage.removeItem(OFFLINE_MUTATION_QUEUE_KEY);
      useNetworkSyncStore.getState().resetPendingMutations();
      return 0;
    }

    const baseUrl = getApiBaseUrl();
    const remainingQueue: QueuedMutationItem[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      const ok = await sendQueuedMutationToServer(baseUrl, item);
      if (ok) {
        syncedCount += 1;
      } else {
        remainingQueue.push(item);
      }
    }

    if (remainingQueue.length === 0) {
      await AsyncStorage.removeItem(OFFLINE_MUTATION_QUEUE_KEY);
      useNetworkSyncStore.getState().resetPendingMutations();
    } else {
      await AsyncStorage.setItem(
        OFFLINE_MUTATION_QUEUE_KEY,
        JSON.stringify(remainingQueue)
      );
      useNetworkSyncStore.setState({ pendingMutationsCount: remainingQueue.length });
    }

    const db = await getRemoteDb();
    await saveOfflineSnapshot(db.courses, db.assignments);

    return syncedCount;
  } catch {
    return 0;
  }
}

/**
 * Hàm kích hoạt đồng bộ tức thì khi mạng kết nối trở lại:
 * Xả toàn bộ hàng đợi mutation lên máy chủ từ xa và làm mới truy vấn TanStack Query.
 */
export async function syncWhenBackOnline(): Promise<void> {
  const flushed = await flushOfflineMutationQueue(true);
  if (flushed > 0) {
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
    await queryClient.invalidateQueries({ queryKey: ['assignments'] });
  }
}

function assertServerHealthy(): void {
  const { simulateServerError500 } = useNetworkSyncStore.getState();
  if (simulateServerError500) {
    throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật.');
  }
}

/**
 * GET /courses
 */
export async function fetchCoursesApi(): Promise<Course[]> {
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;
  const baseUrl = getApiBaseUrl();

  if (!effectivelyOffline) {
    await flushOfflineMutationQueue();
    try {
      const response = await fetch(`${baseUrl}/courses`);
      if (response.ok) {
        const remoteCourses = (await response.json()) as Course[];
        const db = await getRemoteDb();
        if (Array.isArray(remoteCourses) && remoteCourses.length > 0) {
          const mergedCourses = db.hasLocalEdits
            ? mergeCourses(remoteCourses, db.courses)
            : remoteCourses;
          await persistRemoteDb({ ...db, courses: mergedCourses });
          await saveOfflineSnapshot(mergedCourses, db.assignments);
          return [...mergedCourses];
        }
      }
    } catch {
      // Fallback to local persisted DB when network request fails
    }
  }

  const db = await getRemoteDb();
  if (!effectivelyOffline) {
    await saveOfflineSnapshot(db.courses, db.assignments);
  }
  return [...db.courses];
}

/**
 * GET /assignments
 */
export async function fetchAssignmentsApi(): Promise<Assignment[]> {
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;
  const baseUrl = getApiBaseUrl();

  if (!effectivelyOffline) {
    await flushOfflineMutationQueue();
    try {
      const response = await fetch(`${baseUrl}/assignments`);
      if (response.ok) {
        const remoteAssignments = (await response.json()) as Assignment[];
        const db = await getRemoteDb();
        if (Array.isArray(remoteAssignments) && remoteAssignments.length > 0) {
          const mergedAssignments = db.hasLocalEdits
            ? mergeAssignments(
                remoteAssignments,
                db.assignments,
                db.deletedAssignmentIds ?? []
              )
            : remoteAssignments;
          await persistRemoteDb({ ...db, assignments: mergedAssignments });
          await saveOfflineSnapshot(db.courses, mergedAssignments);
          return [...mergedAssignments];
        }
      }
    } catch {
      // Fallback to local persisted DB when network request fails
    }
  }

  const db = await getRemoteDb();
  if (!effectivelyOffline) {
    await saveOfflineSnapshot(db.courses, db.assignments);
  }
  return [...db.assignments];
}

function mergeCourses(remote: Course[], local: Course[]): Course[] {
  const map = new Map<string, Course>();
  for (const item of remote) {
    map.set(item.id, item);
  }
  for (const item of local) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function mergeAssignments(
  remote: Assignment[],
  local: Assignment[],
  deletedIds: string[]
): Assignment[] {
  const deletedSet = new Set(deletedIds);
  const map = new Map<string, Assignment>();
  for (const item of remote) {
    if (!deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }
  for (const item of local) {
    if (!deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

/**
 * POST /courses
 */
export async function createCourseApi(input: CreateCourseInput): Promise<Course> {
  assertServerHealthy();
  if (!input.code?.trim() || !input.name?.trim()) {
    throw new Error('Mã học phần và tên môn học là bắt buộc');
  }
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;
  const baseUrl = getApiBaseUrl();

  const newCourse: Course = {
    id: `crs-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    colour: input.colour,
    instructor: input.instructor?.trim() || 'GV. Học phần',
    room: input.room?.trim() || 'Phòng học A1',
  };

  if (!effectivelyOffline) {
    try {
      const response = await fetch(`${baseUrl}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối tạo môn học.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('CREATE_COURSE', newCourse);
    }
  } else {
    await enqueueOfflineMutation('CREATE_COURSE', newCourse);
  }

  const db = await getRemoteDb();
  const nextCourses = [...db.courses, newCourse];
  await persistRemoteDb({
    ...db,
    courses: nextCourses,
    hasLocalEdits: true,
  });
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
  const baseUrl = getApiBaseUrl();

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

  if (!effectivelyOffline) {
    try {
      const response = await fetch(`${baseUrl}/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourse),
      });
      if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật môn học.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('UPDATE_COURSE', updatedCourse);
    }
  } else {
    await enqueueOfflineMutation('UPDATE_COURSE', updatedCourse);
  }

  const nextCourses = [...db.courses];
  nextCourses[existingIndex] = updatedCourse;
  await persistRemoteDb({
    ...db,
    courses: nextCourses,
    hasLocalEdits: true,
  });
  await saveOfflineSnapshot(nextCourses, db.assignments);

  return updatedCourse;
}

/**
 * POST /assignments
 */
export async function createAssignmentApi(input: CreateAssignmentInput): Promise<Assignment> {
  assertServerHealthy();
  if (!input.courseId?.trim() || !input.title?.trim()) {
    throw new Error('Môn học và tiêu đề bài tập là bắt buộc');
  }
  const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
  const effectivelyOffline = !isOnline || simulatedOffline;
  const baseUrl = getApiBaseUrl();

  const newAssignment: Assignment = {
    id: `asg-${Date.now()}`,
    courseId: input.courseId,
    title: input.title.trim(),
    dueAt: input.dueAt,
    status: 'pending',
    notes: input.notes?.trim() || undefined,
    photoUri: input.photoUri,
  };

  if (!effectivelyOffline) {
    try {
      const response = await fetch(`${baseUrl}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      });
      if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối tạo bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('CREATE_ASSIGNMENT', newAssignment);
    }
  } else {
    await enqueueOfflineMutation('CREATE_ASSIGNMENT', newAssignment);
  }

  const db = await getRemoteDb();
  const nextAssignments = [newAssignment, ...db.assignments];
  await persistRemoteDb({
    ...db,
    assignments: nextAssignments,
    hasLocalEdits: true,
  });
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
  const baseUrl = getApiBaseUrl();

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

  if (!effectivelyOffline) {
    try {
      const response = await fetch(`${baseUrl}/assignments/${updatedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment),
      });
      if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối cập nhật bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('UPDATE_ASSIGNMENT', updatedAssignment);
    }
  } else {
    await enqueueOfflineMutation('UPDATE_ASSIGNMENT', updatedAssignment);
  }

  const nextAssignments = [...db.assignments];
  nextAssignments[existingIndex] = updatedAssignment;
  await persistRemoteDb({
    ...db,
    assignments: nextAssignments,
    hasLocalEdits: true,
  });
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
  const baseUrl = getApiBaseUrl();

  const db = await getRemoteDb();
  const exists = db.assignments.some((a) => a.id === assignmentId);
  if (!exists) {
    throw new Error('Không tìm thấy bài tập');
  }

  if (!effectivelyOffline) {
    try {
      const response = await fetch(`${baseUrl}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (response.status >= 500) {
        throw new Error('500 Internal Server Error: Máy chủ từ chối xóa bài tập.');
      }
    } catch (err) {
      if ((err as Error).message?.includes('500')) {
        throw err;
      }
      await enqueueOfflineMutation('DELETE_ASSIGNMENT', { id: assignmentId });
    }
  } else {
    await enqueueOfflineMutation('DELETE_ASSIGNMENT', { id: assignmentId });
  }

  const nextAssignments = db.assignments.filter((a) => a.id !== assignmentId);
  const deletedAssignmentIds = Array.from(
    new Set([...(db.deletedAssignmentIds ?? []), assignmentId])
  );
  await persistRemoteDb({
    ...db,
    assignments: nextAssignments,
    deletedAssignmentIds,
    hasLocalEdits: true,
  });
  await saveOfflineSnapshot(db.courses, nextAssignments);
}

/**
 * Hàm phục vụ kiểm thử: đặt lại dữ liệu về trạng thái mẫu
 */
export function resetRemoteDbForTests(customData?: RemoteDatabaseState): void {
  inMemoryRemoteDb = customData ?? {
    courses: createSeedCourses(),
    assignments: createSeedAssignments(),
    deletedAssignmentIds: [],
    hasLocalEdits: false,
  };
}

/**
 * Module 1 (Bước 1.1): Domain Data Models (TypeScript strict mode)
 * Tuyệt đối không lưu trữ tiến độ tĩnh (completedCount) trong Course.
 * Tiến độ môn học bắt buộc tính toán động (computed, never stored) từ Assignments.
 */

export type CourseColorKey =
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'teal'
  | 'green'
  | 'orange'
  | 'pink'
  | 'red';

export type AssignmentStatus = 'pending' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  studentCode?: string;
  faculty?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  colour: CourseColorKey;
  instructor?: string;
  room?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueAt: string;
  status: AssignmentStatus;
  notes?: string;
  photoUri?: string;
  notificationId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  signedInAt: string;
}

export interface CourseProgressSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  colour: CourseColorKey;
  completed: number;
  outstanding: number;
  total: number;
  percentage: number;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  colour: CourseColorKey;
  instructor?: string;
  room?: string;
}

export interface UpdateCourseInput {
  id: string;
  code?: string;
  name?: string;
  colour?: CourseColorKey;
  instructor?: string;
  room?: string;
}

export interface CreateAssignmentInput {
  courseId: string;
  title: string;
  dueAt: string;
  notes?: string;
  photoUri?: string;
}

export interface UpdateAssignmentInput {
  id: string;
  courseId?: string;
  title?: string;
  dueAt?: string;
  status?: AssignmentStatus;
  notes?: string;
  photoUri?: string;
  notificationId?: string;
}

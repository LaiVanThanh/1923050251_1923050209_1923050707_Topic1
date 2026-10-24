/**
 * Module 3 (Bước 3.1 & 3.2): Selector Tính Toán Tiến Độ Động (Computed Progress)
 * Nguyên tắc bắt buộc trong đề bài:
 * "Progress statistics: completed versus outstanding per course, computed, never stored."
 * Tuyệt đối không tạo cột completedCount trong bảng Course;
 * tiến độ luôn được tính trực tiếp từ danh sách assignments mỗi khi render.
 */

import { Assignment, Course, CourseProgressSummary } from '../types/domain';

export function computeCourseProgress(
  courses: Course[],
  assignments: Assignment[]
): CourseProgressSummary[] {
  return courses.map((course) => {
    const courseAssignments = assignments.filter((item) => item.courseId === course.id);
    const total = courseAssignments.length;
    const completed = courseAssignments.filter((item) => item.status === 'completed').length;
    const outstanding = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      colour: course.colour,
      completed,
      outstanding,
      total,
      percentage,
    };
  });
}

export interface OverallProgressSummary {
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  outstandingAssignments: number;
  overallPercentage: number;
}

export function computeOverallProgress(
  courses: Course[],
  assignments: Assignment[]
): OverallProgressSummary {
  const validCourseIds = new Set(courses.map((c) => c.id));
  const scopedAssignments = assignments.filter((a) => validCourseIds.has(a.courseId));
  const totalAssignments = scopedAssignments.length;
  const completedAssignments = scopedAssignments.filter((a) => a.status === 'completed').length;
  const outstandingAssignments = totalAssignments - completedAssignments;
  const overallPercentage =
    totalAssignments === 0 ? 0 : Math.round((completedAssignments / totalAssignments) * 100);

  return {
    totalCourses: courses.length,
    totalAssignments,
    completedAssignments,
    outstandingAssignments,
    overallPercentage,
  };
}

/**
 * TanStack Query Hooks & Optimistic Updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import {
  cancelScheduledReminder,
  scheduleAssignmentReminder,
} from '../services/notifications';
import { useNetworkSyncStore } from '../services/queryClient';
import {
  createAssignmentApi,
  createCourseApi,
  deleteAssignmentApi,
  fetchAssignmentsApi,
  fetchCoursesApi,
  updateAssignmentApi,
  updateCourseApi,
} from '../services/studyApi';
import {
  Assignment,
  AssignmentStatus,
  Course,
  CreateAssignmentInput,
  CreateCourseInput,
  UpdateAssignmentInput,
  UpdateCourseInput,
} from '../types/domain';

export const COURSES_QUERY_KEY = ['courses'] as const;
export const ASSIGNMENTS_QUERY_KEY = ['assignments'] as const;

interface OptimisticFeedbackState {
  rollbackErrorBanner: string | null;
  lastOptimisticMessage: string | null;
  setRollbackErrorBanner: (msg: string | null) => void;
  setLastOptimisticMessage: (msg: string | null) => void;
}

export const useOptimisticFeedbackStore = create<OptimisticFeedbackState>((set) => ({
  rollbackErrorBanner: null,
  lastOptimisticMessage: null,
  setRollbackErrorBanner: (rollbackErrorBanner) => set({ rollbackErrorBanner }),
  setLastOptimisticMessage: (lastOptimisticMessage) => set({ lastOptimisticMessage }),
}));

export function useCoursesQuery() {
  return useQuery<Course[], Error>({
    queryKey: COURSES_QUERY_KEY,
    queryFn: fetchCoursesApi,
  });
}

export function useAssignmentsQuery() {
  return useQuery<Assignment[], Error>({
    queryKey: ASSIGNMENTS_QUERY_KEY,
    queryFn: fetchAssignmentsApi,
  });
}

export function useCreateCourseMutation() {
  const qc = useQueryClient();
  return useMutation<Course, Error, CreateCourseInput>({
    mutationFn: createCourseApi,
    onSuccess: (created) => {
      qc.setQueryData<Course[]>(COURSES_QUERY_KEY, (old = []) => [...old, created]);
      qc.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });
}

export function useUpdateCourseMutation() {
  const qc = useQueryClient();
  return useMutation<Course, Error, UpdateCourseInput>({
    mutationFn: updateCourseApi,
    onSuccess: (updated) => {
      qc.setQueryData<Course[]>(COURSES_QUERY_KEY, (old = []) =>
        old.map((item) => (item.id === updated.id ? updated : item))
      );
      qc.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });
}

export function useCreateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation<Assignment, Error, CreateAssignmentInput>({
    mutationFn: async (input) => {
      const created = await createAssignmentApi(input);
      const courses = qc.getQueryData<Course[]>(COURSES_QUERY_KEY) ?? [];
      const courseName = courses.find((c) => c.id === created.courseId)?.name;
      const notificationId = await scheduleAssignmentReminder(created, courseName);
      if (notificationId) {
        return await updateAssignmentApi({ id: created.id, notificationId });
      }
      return created;
    },
    onSuccess: (created) => {
      qc.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, (old = []) => [created, ...old]);
      qc.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation<Assignment, Error, UpdateAssignmentInput>({
    mutationFn: async (input) => {
      const updated = await updateAssignmentApi(input);
      if (updated.status === 'completed') {
        await cancelScheduledReminder(updated.notificationId);
      } else if (input.dueAt !== undefined || input.title !== undefined) {
        const courses = qc.getQueryData<Course[]>(COURSES_QUERY_KEY) ?? [];
        const courseName = courses.find((c) => c.id === updated.courseId)?.name;
        const notificationId = await scheduleAssignmentReminder(updated, courseName);
        if (notificationId && notificationId !== updated.notificationId) {
          return await updateAssignmentApi({ id: updated.id, notificationId });
        }
      }
      return updated;
    },
    onSuccess: (updated) => {
      qc.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, (old = []) =>
        old.map((item) => (item.id === updated.id ? updated : item))
      );
      qc.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });
}

export interface ToggleCompleteVariables {
  assignmentId: string;
  nextStatus?: AssignmentStatus;
}

interface ToggleCompleteContext {
  previousAssignments?: Assignment[];
}

export function useToggleCompleteMutation() {
  const qc = useQueryClient();
  const setRollbackErrorBanner = useOptimisticFeedbackStore((s) => s.setRollbackErrorBanner);
  const setLastOptimisticMessage = useOptimisticFeedbackStore((s) => s.setLastOptimisticMessage);

  return useMutation<Assignment, Error, ToggleCompleteVariables, ToggleCompleteContext>({
    mutationFn: async ({ assignmentId, nextStatus }) => {
      const currentList = qc.getQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY) ?? [];
      const target = currentList.find((a) => a.id === assignmentId);
      const resolvedStatus: AssignmentStatus =
        nextStatus ?? (target?.status === 'completed' ? 'pending' : 'completed');

      const updated = await updateAssignmentApi({
        id: assignmentId,
        status: resolvedStatus,
      });

      if (resolvedStatus === 'completed' && updated.notificationId) {
        await cancelScheduledReminder(updated.notificationId);
      }

      return updated;
    },

    onMutate: async ({ assignmentId, nextStatus }) => {
      setRollbackErrorBanner(null);
      await qc.cancelQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });

      const previousAssignments = qc.getQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY);

      qc.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, (old = []) =>
        old.map((item) => {
          if (item.id !== assignmentId) return item;
          const resolvedStatus: AssignmentStatus =
            nextStatus ?? (item.status === 'completed' ? 'pending' : 'completed');
          return {
            ...item,
            status: resolvedStatus,
          };
        })
      );

      setLastOptimisticMessage('Đã cập nhật trạng thái tức thì');
      return { previousAssignments };
    },

    onError: (error, _variables, context) => {
      if (context?.previousAssignments) {
        qc.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, context.previousAssignments);
      }
      setLastOptimisticMessage(null);
      setRollbackErrorBanner(
        `Đã khôi phục trạng thái cũ do lỗi máy chủ: ${error.message}`
      );
    },

    onSettled: (_data, error) => {
      if (!error) {
        const { isOnline, simulatedOffline } = useNetworkSyncStore.getState();
        if (isOnline && !simulatedOffline) {
          qc.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
        }
      }
    },
  });
}

export function useDeleteAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; notificationId?: string }>({
    mutationFn: async ({ id, notificationId }) => {
      if (notificationId) {
        await cancelScheduledReminder(notificationId);
      }
      await deleteAssignmentApi(id);
    },
    onSuccess: (_data, { id }) => {
      qc.setQueryData<Assignment[]>(ASSIGNMENTS_QUERY_KEY, (old = []) =>
        old.filter((item) => item.id !== id)
      );
      qc.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });
}

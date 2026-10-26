/**
 * Bài Test Tự động số 3 (Critical Path Test) — Bước 5.4:
 * Kiểm thử luồng cốt lõi:
 * Người dùng mở màn hình Chi tiết Bài tập (app/assignment/[id].tsx)
 * -> bấm đánh dấu hoàn thành (giao diện cập nhật ngay lập tức sang completed và tiến độ môn học tăng lên)
 * -> khi giả lập API trả về lỗi 500 thì trạng thái tự động rollback chính xác về pending.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import AssignmentDetailScreen from '../app/assignment/[id]';
import {
  ASSIGNMENTS_QUERY_KEY,
  COURSES_QUERY_KEY,
  useOptimisticFeedbackStore,
} from '../src/hooks/useStudyQueries';
import * as studyApi from '../src/services/studyApi';
import { Assignment, Course } from '../src/types/domain';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    id: 'asg-critical-1',
  }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-mobile',
    code: 'TH7011101',
    name: 'Lập trình Mobile',
    colour: 'blue',
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-critical-1',
    courseId: 'crs-mobile',
    title: 'Kiểm thử Optimistic Update & Rollback 500',
    dueAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    status: 'pending',
    notes: 'Kiểm tra luồng onMutate cập nhật tức thì và onError khôi phục snapshot.',
  },
];

describe('Test 3 (Critical Path Test): Optimistic Update & Tự Động Rollback Khi Lỗi 500', () => {
  beforeEach(() => {
    useOptimisticFeedbackStore.getState().setRollbackErrorBanner(null);
    jest.restoreAllMocks();
  });

  it('cập nhật ngay sang COMPLETED (100%) khi bấm nút Hoàn thành và tự động Rollback về PENDING (0%) khi Server trả lỗi 500', async () => {
    let rejectServerCall!: (err: Error) => void;

    // Giả lập API updateAssignmentApi đang treo (chờ mạng) rồi trả về lỗi 500
    jest.spyOn(studyApi, 'updateAssignmentApi').mockImplementation(
      () =>
        new Promise<Assignment>((_resolve, reject) => {
          rejectServerCall = reject;
        })
    );

    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
        },
        mutations: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    // Nạp dữ liệu ban đầu vào cache
    testQueryClient.setQueryData(COURSES_QUERY_KEY, INITIAL_COURSES);
    testQueryClient.setQueryData(ASSIGNMENTS_QUERY_KEY, INITIAL_ASSIGNMENTS);

    render(
      <QueryClientProvider client={testQueryClient}>
        <AssignmentDetailScreen />
      </QueryClientProvider>
    );

    // 1. Trạng thái ban đầu: bài tập đang là PENDING và tiến độ môn học là 0/1 (0%)
    expect(screen.getByText('PENDING • ĐANG CHỜ')).toBeTruthy();
    expect(screen.getByTestId('detail-course-progress-text').props.children.join('')).toContain(
      '0/1 bài hoàn thành (0%)'
    );

    // 2. Người dùng bấm nút Đánh dấu Hoàn thành -> Optimistic Update (onMutate) chạy ngay lập tức
    const toggleBtn = screen.getByTestId('detail-optimistic-toggle-btn');
    fireEvent.press(toggleBtn);

    // Giao diện lập tức chuyển sang COMPLETED và tiến độ môn học tăng lên 1/1 (100%) trước khi server trả lời
    await waitFor(() => {
      expect(screen.getByText('COMPLETED • ĐÃ XONG')).toBeTruthy();
      expect(
        screen.getByTestId('detail-course-progress-text').props.children.join('')
      ).toContain('1/1 bài hoàn thành (100%)');
    });

    // 3. Máy chủ trả về lỗi 500 Internal Server Error -> onError kích hoạt Rollback
    await act(async () => {
      rejectServerCall(new Error('500 Internal Server Error'));
    });

    // 4. Trạng thái tự động Rollback chính xác về PENDING, tiến độ môn học quay về 0/1 (0%) kèm cảnh báo lỗi
    await waitFor(() => {
      expect(screen.getByText('PENDING • ĐANG CHỜ')).toBeTruthy();
      expect(
        screen.getByTestId('detail-course-progress-text').props.children.join('')
      ).toContain('0/1 bài hoàn thành (0%)');
      expect(screen.getByTestId('detail-rollback-alert')).toBeTruthy();
    });
  });
});

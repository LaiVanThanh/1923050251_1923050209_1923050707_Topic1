/**
 * Bài Test Tự động số 2 (Component Test) — Bước 4.4:
 * Sử dụng React Native Testing Library kiểm tra màn hình HomePlannerScreen / ScreenStateView:
 * 1. Hiển thị đúng trạng thái Error + nút Retry, và khi bấm nút Retry thì hàm tải lại dữ liệu được gọi.
 * 2. Hiển thị đúng trạng thái Empty khi bộ lọc không khớp bài tập nào.
 * 3. Khi chọn bộ lọc trạng thái (Pending vs Completed) thì giao diện chỉ hiển thị các bài tập tương ứng.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import HomePlannerScreen from '../app/(tabs)/index';
import { ScreenStateView } from '../src/components/ScreenStateView';
import * as studyApi from '../src/services/studyApi';
import { usePlannerFilterStore } from '../src/store/usePlannerFilterStore';
import { Assignment, Course } from '../src/types/domain';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const MOCK_COURSES: Course[] = [
  {
    id: 'crs-1',
    code: 'TH7011101',
    name: 'Lập trình Mobile',
    colour: 'blue',
  },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-pending-1',
    courseId: 'crs-1',
    title: 'Bài tập Đang Chờ Xử Lý',
    dueAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'asg-completed-1',
    courseId: 'crs-1',
    title: 'Bài tập Đã Hoàn Thành Xong',
    dueAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    status: 'completed',
  },
];

describe('Test 2 (Component Test): Màn hình Home Planner, 4 Trạng thái & Bộ Lọc', () => {
  beforeEach(() => {
    usePlannerFilterStore.getState().resetFilters();
    usePlannerFilterStore.getState().setViewMode('list');
    jest.restoreAllMocks();
  });

  it('hiển thị đúng trạng thái Error và gọi hàm onRetry khi bấm nút Thử lại', () => {
    const onRetryMock = jest.fn();

    render(
      <ScreenStateView
        isLoading={false}
        isError={true}
        errorTitle="Lỗi kết nối máy chủ"
        errorMessage="Không thể tải danh sách bài tập."
        onRetry={onRetryMock}
      >
        <></>
      </ScreenStateView>
    );

    expect(screen.getByTestId('screen-state-error')).toBeTruthy();
    expect(screen.getByText('Không thể tải danh sách bài tập.')).toBeTruthy();

    const retryButton = screen.getByTestId('screen-state-retry-button');
    fireEvent.press(retryButton);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('hiển thị đúng trạng thái Empty khi không có dữ liệu khớp bộ lọc', () => {
    render(
      <ScreenStateView
        isLoading={false}
        isError={false}
        isEmpty={true}
        emptyTitle="Không có bài tập khớp bộ lọc"
        emptyMessage="Danh sách trống."
      >
        <></>
      </ScreenStateView>
    );

    expect(screen.getByTestId('screen-state-empty')).toBeTruthy();
    expect(screen.getByText('Không có bài tập khớp bộ lọc')).toBeTruthy();
  });

  it('khi chọn bộ lọc trạng thái Pending / Completed trên HomePlannerScreen thì chỉ hiển thị các bài tập tương ứng', async () => {
    jest.spyOn(studyApi, 'fetchCoursesApi').mockResolvedValue(MOCK_COURSES);
    jest.spyOn(studyApi, 'fetchAssignmentsApi').mockResolvedValue(MOCK_ASSIGNMENTS);

    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });

    render(
      <QueryClientProvider client={testQueryClient}>
        <HomePlannerScreen />
      </QueryClientProvider>
    );

    // Chờ dữ liệu tải xong: ở chế độ mặc định 'ALL', cả 2 bài tập đều xuất hiện
    await waitFor(() => {
      expect(screen.getByTestId('assignment-card-asg-pending-1')).toBeTruthy();
      expect(screen.getByTestId('assignment-card-asg-completed-1')).toBeTruthy();
    });

    // Bấm chọn bộ lọc 'pending' -> chỉ hiển thị bài tập đang chờ
    fireEvent.press(screen.getByTestId('status-filter-pending'));

    await waitFor(() => {
      expect(screen.getByTestId('assignment-card-asg-pending-1')).toBeTruthy();
      expect(screen.queryByTestId('assignment-card-asg-completed-1')).toBeNull();
    });

    // Bấm chọn bộ lọc 'completed' -> chỉ hiển thị bài tập đã hoàn thành
    fireEvent.press(screen.getByTestId('status-filter-completed'));

    await waitFor(() => {
      expect(screen.getByTestId('assignment-card-asg-completed-1')).toBeTruthy();
      expect(screen.queryByTestId('assignment-card-asg-pending-1')).toBeNull();
    });
  });
});

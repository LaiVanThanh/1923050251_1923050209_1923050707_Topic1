/**
 * Test Suite: Modal Editor Route (app/modal/editor.tsx)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import ModalEditorScreen from '../app/modal/editor';
import * as studyApi from '../src/services/studyApi';
import { Course } from '../src/types/domain';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { mode: 'assignment' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams,
}));

const MOCK_COURSES: Course[] = [
  {
    id: 'crs-math-1',
    code: 'MAT101',
    name: 'Giải tích 1',
    colour: 'blue',
  },
  {
    id: 'crs-eng-2',
    code: 'ENG103',
    name: 'Tiếng Anh học thuật',
    colour: 'teal',
  },
];

describe('Modal Editor Screen', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { mode: 'assignment' };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });

    jest.spyOn(studyApi, 'fetchCoursesApi').mockResolvedValue(MOCK_COURSES);
    jest.spyOn(studyApi, 'fetchAssignmentsApi').mockResolvedValue([]);
  });

  it('cho phép chuyển đổi giữa tab Biên tập Bài tập và Biên tập Môn học', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('assignment-editor-form')).toBeTruthy();
      expect(screen.queryByTestId('course-editor-form')).toBeNull();
    });

    const courseModeBtn = screen.getByTestId('editor-mode-course');
    fireEvent.press(courseModeBtn);

    await waitFor(() => {
      expect(screen.getByTestId('course-editor-form')).toBeTruthy();
      expect(screen.queryByTestId('assignment-editor-form')).toBeNull();
    });
  });

  it('báo lỗi validation khi lưu bài tập mà chưa nhập tiêu đề', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('assignment-editor-form')).toBeTruthy();
    });

    const saveBtn = screen.getByTestId('save-assignment-btn');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tiêu đề bài tập.')).toBeTruthy();
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('lưu bài tập thành công và gọi router.back khi nhập tiêu đề hợp lệ', async () => {
    const createAsgSpy = jest
      .spyOn(studyApi, 'createAssignmentApi')
      .mockResolvedValue({
        id: 'new-asg-id',
        courseId: 'crs-math-1',
        title: 'Làm bài tập số 1',
        dueAt: new Date().toISOString(),
        status: 'pending',
      });

    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('assignment-title-input')).toBeTruthy();
    });

    const titleInput = screen.getByTestId('assignment-title-input');
    fireEvent.changeText(titleInput, 'Làm bài tập số 1');

    const saveBtn = screen.getByTestId('save-assignment-btn');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(createAsgSpy).toHaveBeenCalledTimes(1);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  it('báo lỗi validation khi tạo môn học mà để trống mã học phần hoặc tên môn', async () => {
    mockParams = { mode: 'course' };

    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('course-editor-form')).toBeTruthy();
    });

    const saveBtn = screen.getByTestId('save-course-btn');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Vui lòng nhập mã học phần.')
      ).toBeTruthy();
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('tạo môn học mới thành công và đóng Modal', async () => {
    mockParams = { mode: 'course' };
    const createCourseSpy = jest
      .spyOn(studyApi, 'createCourseApi')
      .mockResolvedValue({
        id: 'crs-new',
        code: 'PHY102',
        name: 'Vật lý 2',
        colour: 'indigo',
      });

    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('course-code-input')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('course-code-input'), 'PHY102');
    fireEvent.changeText(screen.getByTestId('course-name-input'), 'Vật lý 2');

    const saveBtn = screen.getByTestId('save-course-btn');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(createCourseSpy).toHaveBeenCalledTimes(1);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  it('cho phép chọn mốc giờ nhanh và cập nhật thời hạn nộp', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-hour-1700')).toBeTruthy();
    });

    const quickHour17 = screen.getByTestId('quick-hour-1700');
    fireEvent.press(quickHour17);

    const hourInput = screen.getByTestId('custom-deadline-hour-input');
    const minuteInput = screen.getByTestId('custom-deadline-minute-input');
    expect(hourInput.props.value).toBe('17');
    expect(minuteInput.props.value).toBe('00');
  });

  it('cho phép nhập giờ và phút tùy chỉnh vào ô input', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-deadline-hour-input')).toBeTruthy();
      expect(screen.getByTestId('custom-deadline-minute-input')).toBeTruthy();
    });

    const hourInput = screen.getByTestId('custom-deadline-hour-input');
    const minuteInput = screen.getByTestId('custom-deadline-minute-input');

    fireEvent.changeText(hourInput, '21');
    fireEvent.changeText(minuteInput, '45');

    expect(hourInput.props.value).toBe('21');
    expect(minuteInput.props.value).toBe('45');
  });

  it('cho phép tăng giảm giờ nộp bằng nút điều chỉnh +1 giờ và -1 giờ', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-hour-1400')).toBeTruthy();
    });

    // Đặt mốc 14:00
    fireEvent.press(screen.getByTestId('quick-hour-1400'));
    const hourInput = screen.getByTestId('custom-deadline-hour-input');
    expect(hourInput.props.value).toBe('14');

    // Bấm +1 giờ -> 15:00
    const add1hBtn = screen.getByTestId('adjust-time-add-1h');
    fireEvent.press(add1hBtn);
    expect(hourInput.props.value).toBe('15');

    // Bấm -1 giờ -> 14:00
    const sub1hBtn = screen.getByTestId('adjust-time-sub-1h');
    fireEvent.press(sub1hBtn);
    expect(hourInput.props.value).toBe('14');
  });

  it('cho phép chọn ngày nộp nhanh bằng chip ngày', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ModalEditorScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-day-tomorrow')).toBeTruthy();
    });

    const tomorrowChip = screen.getByTestId('quick-day-tomorrow');
    fireEvent.press(tomorrowChip);

    const dateInput = screen.getByTestId('custom-deadline-date-input');
    expect(dateInput.props.value).toBeTruthy();
  });
});

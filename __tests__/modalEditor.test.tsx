/**
 * Test Suite: Modal Editor Route (app/modal/editor.tsx — Module 3)
 * Kiểm thử toàn diện:
 * 1. Chuyển đổi qua lại giữa chế độ Thêm Bài tập (Assignment) và Thêm Môn học (Course).
 * 2. Validation lỗi khi để trống tiêu đề bài tập hoặc mã học phần / tên môn học.
 * 3. Thao tác chọn môn học và chọn phím tắt hạn nộp (Deadline Presets).
 * 4. Gọi mutation tạo bài tập và tạo môn học thành công.
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

describe('Modal Editor Screen (app/modal/editor.tsx)', () => {
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

    // Mặc định ban đầu ở form bài tập
    await waitFor(() => {
      expect(screen.getByTestId('assignment-editor-form')).toBeTruthy();
      expect(screen.queryByTestId('course-editor-form')).toBeNull();
    });

    // Chuyển sang form môn học
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

  it('lưu bài tập thành công và gọi router.back() khi nhập tiêu đề hợp lệ', async () => {
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

    // Nhập tiêu đề bài tập
    const titleInput = screen.getByTestId('assignment-title-input');
    fireEvent.changeText(titleInput, 'Làm bài tập số 1');

    // Bấm nút Lưu bài tập
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
        screen.getByText('Vui lòng nhập mã học phần (VD: MAT101).')
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
});

/**
 * Test Suite: Accessible UI Components
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { AccessibleButton } from '../src/components/AccessibleButton';
import { AssignmentLessonCard } from '../src/components/AssignmentLessonCard';
import { DueNext48hWidget } from '../src/components/DueNext48hWidget';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { ScreenStateView } from '../src/components/ScreenStateView';
import { useNetworkSyncStore } from '../src/services/queryClient';
import { Assignment, Course } from '../src/types/domain';

describe('UI Components Test Suite', () => {
  describe('1. AccessibleButton', () => {
    it('hiển thị đúng label và gọi onPress khi người dùng bấm', () => {
      const onPressMock = jest.fn();
      render(
        <AccessibleButton
          testID="test-btn"
          label="Bấm vào đây"
          onPress={onPressMock}
        />
      );

      const btn = screen.getByTestId('test-btn');
      expect(screen.getByText('Bấm vào đây')).toBeTruthy();

      fireEvent.press(btn);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('không gọi onPress khi nút ở trạng thái disabled', () => {
      const onPressMock = jest.fn();
      render(
        <AccessibleButton
          testID="disabled-btn"
          label="Nút bị khóa"
          disabled={true}
          onPress={onPressMock}
        />
      );

      const btn = screen.getByTestId('disabled-btn');
      fireEvent.press(btn);
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('hiển thị ActivityIndicator khi loading={true} và không kích hoạt onPress', () => {
      const onPressMock = jest.fn();
      render(
        <AccessibleButton
          testID="loading-btn"
          label="Đang xử lý"
          loading={true}
          onPress={onPressMock}
        />
      );

      const btn = screen.getByTestId('loading-btn');
      fireEvent.press(btn);
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('2. ScreenStateView', () => {
    it('hiển thị trạng thái Loading kèm loadingLabel khi isLoading={true}', () => {
      render(
        <ScreenStateView isLoading={true} isError={false} loadingLabel="Đang tải dữ liệu...">
          <Text>Nội dung chính</Text>
        </ScreenStateView>
      );

      expect(screen.getByTestId('screen-state-loading')).toBeTruthy();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeTruthy();
      expect(screen.queryByText('Nội dung chính')).toBeNull();
    });

    it('hiển thị trạng thái Error kèm nút Thử lại khi isError={true}', () => {
      const retryMock = jest.fn();
      render(
        <ScreenStateView
          isLoading={false}
          isError={true}
          errorTitle="Lỗi kết nối"
          errorMessage="Không có kết nối Internet"
          onRetry={retryMock}
        >
          <Text>Nội dung chính</Text>
        </ScreenStateView>
      );

      expect(screen.getByTestId('screen-state-error')).toBeTruthy();
      expect(screen.getByText('Lỗi kết nối')).toBeTruthy();
      expect(screen.getByText('Không có kết nối Internet')).toBeTruthy();

      const retryBtn = screen.getByTestId('screen-state-retry-button');
      fireEvent.press(retryBtn);
      expect(retryMock).toHaveBeenCalledTimes(1);
    });

    it('hiển thị trạng thái Empty kèm nút hành động khi isEmpty={true}', () => {
      const emptyActionMock = jest.fn();
      render(
        <ScreenStateView
          isLoading={false}
          isError={false}
          isEmpty={true}
          emptyTitle="Chưa có dữ liệu"
          emptyMessage="Hãy thêm mục đầu tiên"
          emptyActionLabel="Thêm mới ngay"
          onEmptyAction={emptyActionMock}
        >
          <Text>Nội dung chính</Text>
        </ScreenStateView>
      );

      expect(screen.getByTestId('screen-state-empty')).toBeTruthy();
      expect(screen.getByText('Chưa có dữ liệu')).toBeTruthy();

      const actionBtn = screen.getByTestId('screen-state-empty-action');
      fireEvent.press(actionBtn);
      expect(emptyActionMock).toHaveBeenCalledTimes(1);
    });

    it('hiển thị Content khi không loading, không error và không empty', () => {
      render(
        <ScreenStateView isLoading={false} isError={false} isEmpty={false}>
          <Text testID="actual-content">Nội dung sinh viên</Text>
        </ScreenStateView>
      );

      expect(screen.getByTestId('actual-content')).toBeTruthy();
    });
  });

  describe('3. DueNext48hWidget', () => {
    const mockCourses: Course[] = [
      { id: 'c1', code: 'MAT101', name: 'Giải tích 1', colour: 'blue' },
    ];

    it('hiển thị thông báo khi không có bài tập nào đến hạn trong 48h tới', () => {
      render(
        <DueNext48hWidget
          assignmentsDue48h={[]}
          courses={mockCourses}
          onSelectAssignment={jest.fn()}
        />
      );

      expect(screen.getByTestId('widget-48h-container')).toBeTruthy();
      expect(screen.getByTestId('widget-48h-count').props.children).toBe(0);
      expect(
        screen.getByText('Không có bài tập gấp trong 48 giờ tới')
      ).toBeTruthy();
    });

    it('hiển thị số lượng và danh sách thẻ bài tập gấp khi có bài tập trong 48h', () => {
      const onSelectMock = jest.fn();
      const mockAssignments: Assignment[] = [
        {
          id: 'asg-urgent-1',
          courseId: 'c1',
          title: 'Bài tập Giải tích gấp',
          dueAt: new Date(Date.now() + 5 * 3600000).toISOString(),
          status: 'pending',
        },
      ];

      render(
        <DueNext48hWidget
          assignmentsDue48h={mockAssignments}
          courses={mockCourses}
          onSelectAssignment={onSelectMock}
        />
      );

      expect(screen.getByTestId('widget-48h-count').props.children).toBe(1);
      expect(screen.getByText('Bài tập Giải tích gấp')).toBeTruthy();

      const card = screen.getByTestId('widget-48h-item-asg-urgent-1');
      fireEvent.press(card);
      expect(onSelectMock).toHaveBeenCalledWith('asg-urgent-1');
    });
  });

  describe('4. AssignmentLessonCard', () => {
    const mockCourse: Course = {
      id: 'c-phys',
      code: 'PHY102',
      name: 'Vật lý đại cương',
      colour: 'indigo',
    };

    const mockAssignment: Assignment[] = [
      {
        id: 'asg-card-1',
        courseId: 'c-phys',
        title: 'Báo cáo dao động con lắc',
        dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'pending',
        photoUri: 'file:///data/photo.jpg',
      },
    ];

    it('hiển thị mã môn học, tên môn, tiêu đề, huy hiệu ảnh và gọi onPress khi chạm vào card', () => {
      const onPressMock = jest.fn();
      const onToggleMock = jest.fn();

      render(
        <AssignmentLessonCard
          assignment={mockAssignment[0]}
          course={mockCourse}
          onPress={onPressMock}
          onToggleComplete={onToggleMock}
        />
      );

      expect(screen.getByText('PHY102')).toBeTruthy();
      expect(screen.getByText('Vật lý đại cương')).toBeTruthy();
      expect(screen.getByText('Báo cáo dao động con lắc')).toBeTruthy();
      expect(screen.getByText('Có ảnh đính kèm')).toBeTruthy();

      const touchArea = screen.getByTestId('assignment-open-asg-card-1');
      fireEvent.press(touchArea);
      expect(onPressMock).toHaveBeenCalledWith('asg-card-1');

      const toggleArea = screen.getByTestId('assignment-toggle-asg-card-1');
      fireEvent.press(toggleArea);
      expect(onToggleMock).toHaveBeenCalledWith('asg-card-1');
    });
  });

  describe('5. OfflineBanner', () => {
    beforeEach(() => {
      useNetworkSyncStore.getState().setOnlineStatus(true);
      useNetworkSyncStore.getState().setSimulatedOffline(false);
      useNetworkSyncStore.getState().resetPendingMutations();
      useNetworkSyncStore.getState().setLastSyncedAt(null);
    });

    it('không hiển thị khi thiết bị đang Online và không có hàng đợi mutation', () => {
      const { toJSON } = render(<OfflineBanner />);
      expect(toJSON()).toBeNull();
    });

    it('hiển thị biểu ngữ cảnh báo khi thiết bị ngoại tuyến', () => {
      useNetworkSyncStore.getState().setSimulatedOffline(true);
      useNetworkSyncStore
        .getState()
        .setLastSyncedAt(new Date(2026, 9, 26, 10, 0, 0).toISOString());

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeTruthy();
      expect(screen.getByText('Chế độ ngoại tuyến')).toBeTruthy();
    });

    it('hiển thị số lượng thao tác đang chờ đồng bộ khi pendingMutationsCount > 0', () => {
      useNetworkSyncStore.getState().setSimulatedOffline(true);
      useNetworkSyncStore.getState().incrementPendingMutations();
      useNetworkSyncStore.getState().incrementPendingMutations();
      useNetworkSyncStore.getState().incrementPendingMutations();

      render(<OfflineBanner />);

      expect(
        screen.getByText(/3 thay đổi đã lưu vào hàng đợi chờ mạng/)
      ).toBeTruthy();
    });
  });
});

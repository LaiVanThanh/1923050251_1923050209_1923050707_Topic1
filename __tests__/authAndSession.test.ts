/**
 * Test Suite: Authentication & Session Storage (Module 2)
 * Kiểm thử toàn diện:
 * 1. authStorage.ts: Lưu trữ, khôi phục và xóa phiên an toàn qua Expo SecureStore.
 * 2. useAuthStore.ts: Hydration, validation đăng nhập, xử lý lỗi 500, đăng xuất xóa cache.
 */

import * as SecureStore from 'expo-secure-store';
import {
  clearSessionSecurely,
  loadSessionSecurely,
  saveSessionSecurely,
} from '../src/services/authStorage';
import { queryClient } from '../src/services/queryClient';
import { useAuthStore } from '../src/store/useAuthStore';
import { AuthSession } from '../src/types/domain';

describe('Authentication & Session Storage (Module 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      status: 'unauthenticated',
      user: null,
      token: null,
      isSubmitting: false,
      errorMessage: null,
    });
  });

  describe('1. authStorage.ts: SecureStore Operations', () => {
    const mockSession: AuthSession = {
      token: 'jwt-mock-test-token-12345',
      user: {
        id: 'usr-test-1',
        name: 'Sinh viên Kiểm thử',
        email: 'test@example.edu.vn',
        studentCode: 'SVTEST01',
        faculty: 'Khoa Công nghệ Thông tin',
      },
      signedInAt: new Date(Date.now() + 86400000).toISOString(),
    };

    it('saveSessionSecurely lưu phiên mã hóa thành công vào SecureStore', async () => {
      const setItemSpy = jest.spyOn(SecureStore, 'setItemAsync');
      await saveSessionSecurely(mockSession);

      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(setItemSpy).toHaveBeenCalledWith(
        'study_planner_secure_session_v1',
        JSON.stringify(mockSession)
      );
    });

    it('loadSessionSecurely đọc và parse phiên hợp lệ từ SecureStore', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(JSON.stringify(mockSession));
      const session = await loadSessionSecurely();

      expect(session).not.toBeNull();
      expect(session?.token).toBe(mockSession.token);
      expect(session?.user.email).toBe(mockSession.user.email);
    });

    it('loadSessionSecurely trả về null nếu SecureStore trống', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
      const session = await loadSessionSecurely();
      expect(session).toBeNull();
    });

    it('loadSessionSecurely xử lý an toàn và trả về null khi dữ liệu JSON bị hỏng (corrupted)', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('{ invalid-json-corrupted: ');
      const session = await loadSessionSecurely();
      expect(session).toBeNull();
    });

    it('clearSessionSecurely xóa khóa lưu trữ khỏi SecureStore', async () => {
      const deleteItemSpy = jest.spyOn(SecureStore, 'deleteItemAsync');
      await clearSessionSecurely();
      expect(deleteItemSpy).toHaveBeenCalledWith('study_planner_secure_session_v1');
    });
  });

  describe('2. useAuthStore.ts: Auth State Machine & Actions', () => {
    it('hydrateAuth nạp phiên đã lưu và chuyển trạng thái sang authenticated', async () => {
      const mockSession: AuthSession = {
        token: 'token-hydrated',
        user: {
          id: 'usr-h1',
          name: 'Nguyễn Văn A',
          email: 'sinhvien01@example.edu.vn',
          studentCode: 'SV001',
        },
        signedInAt: new Date(Date.now() + 3600000).toISOString(),
      };
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(JSON.stringify(mockSession));

      await useAuthStore.getState().hydrateAuth();

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.token).toBe('token-hydrated');
      expect(state.user?.name).toBe('Nguyễn Văn A');
    });

    it('hydrateAuth chuyển sang unauthenticated khi chưa có phiên đăng nhập', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);

      await useAuthStore.getState().hydrateAuth();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('signIn từ chối và báo lỗi khi email sai định dạng', async () => {
      const result = await useAuthStore.getState().signIn({
        email: 'invalid-email-no-at',
        password: 'password123',
      });

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.errorMessage).toContain('Email sinh viên không đúng định dạng');
    });

    it('signIn từ chối và báo lỗi khi mật khẩu ngắn hơn 6 ký tự', async () => {
      const result = await useAuthStore.getState().signIn({
        email: 'valid@example.edu.vn',
        password: '123',
      });

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.errorMessage).toContain('tối thiểu 6 ký tự');
    });

    it('signIn giả lập lỗi 500 khi mật khẩu là "error500" để kiểm thử Error + Retry', async () => {
      const result = await useAuthStore.getState().signIn({
        email: 'valid@example.edu.vn',
        password: 'error500',
      });

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.errorMessage).toContain('Máy chủ xác thực không phản hồi (500)');
    });

    it('signIn đăng nhập thành công với tài khoản mẫu (sinhvien01@example.edu.vn)', async () => {
      const saveSpy = jest.spyOn(SecureStore, 'setItemAsync');
      const result = await useAuthStore.getState().signIn({
        email: 'sinhvien01@example.edu.vn',
        password: 'password123',
      });

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.studentCode).toBe('SV001');
      expect(state.token).toBeTruthy();
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('signIn đăng nhập thành công với tài khoản tùy biến hợp lệ', async () => {
      const result = await useAuthStore.getState().signIn({
        email: 'student_custom@example.edu.vn',
        password: 'securePass123',
        studentName: 'Sinh viên Tự do',
      });

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user?.name).toBe('Sinh viên Tự do');
      expect(state.user?.email).toBe('student_custom@example.edu.vn');
    });

    it('signOut xóa sạch phiên khỏi SecureStore, đặt lại state và gọi queryClient.clear()', async () => {
      // Trước tiên giả lập đã đăng nhập
      useAuthStore.setState({
        status: 'authenticated',
        token: 'active-token',
        user: { id: 'u1', name: 'User 1', email: 'u1@test.com' },
      });

      const deleteSpy = jest.spyOn(SecureStore, 'deleteItemAsync');
      const queryClientClearSpy = jest.spyOn(queryClient, 'clear');

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(deleteSpy).toHaveBeenCalledWith('study_planner_secure_session_v1');
      expect(queryClientClearSpy).toHaveBeenCalledTimes(1);
    });

    it('clearAuthError xóa thông báo lỗi hiện tại', () => {
      useAuthStore.setState({ errorMessage: 'Đã có lỗi xảy ra' });
      useAuthStore.getState().clearAuthError();
      expect(useAuthStore.getState().errorMessage).toBeNull();
    });
  });
});

/**
 * Module 2 (Bước 2.1 & 2.2): Zustand Auth Store với Selectors
 * Quản lý 3 pha xác thực:
 * - 'hydrating' (đang đọc token từ SecureStore khi vừa mở app)
 * - 'authenticated' (đã đăng nhập hợp lệ)
 * - 'unauthenticated' (chưa đăng nhập hoặc đã đăng xuất)
 *
 * Trong signOut(), bắt buộc xóa sạch SecureStore đồng thời gọi queryClient.clear()
 * để kết thúc hoàn toàn phiên làm việc.
 */

import { create } from 'zustand';
import {
  clearSessionSecurely,
  loadSessionSecurely,
  saveSessionSecurely,
} from '../services/authStorage';
import { clearOfflineSnapshot, queryClient } from '../services/queryClient';
import { AuthSession, User } from '../types/domain';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

export interface SignInCredentials {
  email: string;
  password: string;
  studentName?: string;
}

interface AuthStoreState {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  hydrateAuth: () => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const DEMO_USERS: Record<string, User> = {
  '1923050251@dntu.edu.vn': {
    id: 'usr-1923050251',
    name: 'Lại Văn Thành (1923050251)',
    email: '1923050251@dntu.edu.vn',
    studentCode: '1923050251',
    faculty: 'Công nghệ Thông tin - 23DTH1',
  },
  '1923050209@dntu.edu.vn': {
    id: 'usr-1923050209',
    name: 'Nguyễn Lê Minh Thành (1923050209)',
    email: '1923050209@dntu.edu.vn',
    studentCode: '1923050209',
    faculty: 'Công nghệ Thông tin - 23DTH1',
  },
  '1923050707@dntu.edu.vn': {
    id: 'usr-1923050707',
    name: 'Mai Hoàng Tuấn (1923050707)',
    email: '1923050707@dntu.edu.vn',
    studentCode: '1923050707',
    faculty: 'Công nghệ Thông tin - 23DTH1',
  },
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'hydrating',
  user: null,
  token: null,
  isSubmitting: false,
  errorMessage: null,

  hydrateAuth: async () => {
    set({ status: 'hydrating', errorMessage: null });
    try {
      const session = await loadSessionSecurely();
      if (session && session.token && session.user) {
        set({
          status: 'authenticated',
          user: session.user,
          token: session.token,
          isSubmitting: false,
          errorMessage: null,
        });
      } else {
        set({
          status: 'unauthenticated',
          user: null,
          token: null,
          isSubmitting: false,
          errorMessage: null,
        });
      }
    } catch {
      set({
        status: 'unauthenticated',
        user: null,
        token: null,
        isSubmitting: false,
        errorMessage: 'Không thể khôi phục phiên đăng nhập từ SecureStore.',
      });
    }
  },

  signIn: async ({ email, password, studentName }) => {
    const normalizedEmail = email.trim().toLowerCase();
    set({ isSubmitting: true, errorMessage: null });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      set({
        isSubmitting: false,
        errorMessage: 'Email sinh viên không đúng định dạng (ví dụ: 1923050251@dntu.edu.vn).',
      });
      return false;
    }

    if (!password || password.trim().length < 6) {
      set({
        isSubmitting: false,
        errorMessage: 'Mật khẩu phải có tối thiểu 6 ký tự (theo chuẩn bảo mật).',
      });
      return false;
    }

    // Hỗ trợ giả lập lỗi xác thực khi nhập mật khẩu 'error500' để kiểm thử trạng thái Error + Retry
    if (password.trim() === 'error500') {
      set({
        isSubmitting: false,
        errorMessage: 'Máy chủ xác thực không phản hồi (500). Vui lòng bấm Thử lại.',
      });
      return false;
    }

    try {
      const matchedUser: User = DEMO_USERS[normalizedEmail] ?? {
        id: `usr-${normalizedEmail.split('@')[0]}`,
        name:
          studentName?.trim() ||
          `Sinh viên DNTU (${normalizedEmail.split('@')[0].toUpperCase()})`,
        email: normalizedEmail,
        studentCode: normalizedEmail.split('@')[0],
        faculty: 'Trường ĐH Công Nghệ Đồng Nai (23DTH1)',
      };

      const session: AuthSession = {
        token: `jwt-secure-${matchedUser.id}-${Date.now()}`,
        user: matchedUser,
        signedInAt: new Date().toISOString(),
      };

      await saveSessionSecurely(session);

      set({
        status: 'authenticated',
        user: session.user,
        token: session.token,
        isSubmitting: false,
        errorMessage: null,
      });
      return true;
    } catch {
      set({
        isSubmitting: false,
        errorMessage: 'Không thể lưu phiên bảo mật vào Expo SecureStore. Vui lòng thử lại.',
      });
      return false;
    }
  },

  signOut: async () => {
    set({ isSubmitting: true });
    await clearSessionSecurely();
    await clearOfflineSnapshot();
    queryClient.clear();
    set({
      status: 'unauthenticated',
      user: null,
      token: null,
      isSubmitting: false,
      errorMessage: null,
    });
  },

  clearAuthError: () => set({ errorMessage: null }),
}));

/**
 * Selectors chuyên biệt theo đúng Bước 2.2
 */
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useAuthSubmitting = () => useAuthStore((s) => s.isSubmitting);
export const useAuthError = () => useAuthStore((s) => s.errorMessage);

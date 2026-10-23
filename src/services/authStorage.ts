/**
 * Module 2 (Bước 2.1 & 2.2): Lưu Trữ Phiên Bảo Mật Bằng Expo SecureStore
 * "Sign in and sign out, with the session surviving an app restart and truly ending on sign-out.
 *  Secrets in SecureStore only."
 * Tuyệt đối KHÔNG dùng AsyncStorage cho token/bí mật xác thực.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthSession } from '../types/domain';

const SECURE_SESSION_KEY = 'study_planner_secure_session_v1';

// Bộ nhớ đệm dự phòng chỉ dùng trong môi trường Jest hoặc Web nơi Keychain native không hoạt động
let memoryFallbackSession: string | null = null;

async function isSecureStoreSupported(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * 1. Lưu phiên đăng nhập bảo mật vào Expo SecureStore
 */
export async function saveSessionSecurely(session: AuthSession): Promise<void> {
  const serialized = JSON.stringify(session);
  const supported = await isSecureStoreSupported();
  if (supported) {
    await SecureStore.setItemAsync(SECURE_SESSION_KEY, serialized);
  } else {
    memoryFallbackSession = serialized;
  }
}

/**
 * 2. Đọc phiên đăng nhập từ Expo SecureStore khi khởi động ứng dụng (Hydration)
 */
export async function loadSessionSecurely(): Promise<AuthSession | null> {
  try {
    const supported = await isSecureStoreSupported();
    const raw = supported
      ? await SecureStore.getItemAsync(SECURE_SESSION_KEY)
      : memoryFallbackSession;

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.id || !parsed?.user?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 3. Xóa sạch hoàn toàn token & phiên đăng nhập khỏi Expo SecureStore khi Sign Out
 */
export async function clearSessionSecurely(): Promise<void> {
  memoryFallbackSession = null;
  try {
    const supported = await isSecureStoreSupported();
    if (supported) {
      await SecureStore.deleteItemAsync(SECURE_SESSION_KEY);
    }
  } catch {
    // Đảm bảo không treo ứng dụng nếu thiết bị lỗi Keychain
  }
}

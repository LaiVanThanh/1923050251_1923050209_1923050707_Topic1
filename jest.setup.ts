/**
 * Cấu hình môi trường kiểm thử Jest cho Study Planner (Topic 01)
 */

jest.setTimeout(30000);

const mockAsyncStorageMap = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorageMap.set(key, String(value));
    return Promise.resolve();
  }),
  getItem: jest.fn((key: string) => {
    return Promise.resolve(
      mockAsyncStorageMap.has(key) ? mockAsyncStorageMap.get(key)! : null
    );
  }),
  removeItem: jest.fn((key: string) => {
    mockAsyncStorageMap.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorageMap.clear();
    return Promise.resolve();
  }),
}));

const mockSecureStoreMap = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStoreMap.set(key, String(value));
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) => {
    return Promise.resolve(
      mockSecureStoreMap.has(key) ? mockSecureStoreMap.get(key)! : null
    );
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStoreMap.delete(key);
    return Promise.resolve();
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  scheduleNotificationAsync: jest.fn(() =>
    Promise.resolve('mock-notif-id-123')
  ),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 3,
  },
}));

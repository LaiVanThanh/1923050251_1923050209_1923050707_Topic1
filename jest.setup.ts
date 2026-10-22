/**
 * Cấu hình môi trường kiểm thử Jest cho Study Planner (Topic 01)
 */

jest.setTimeout(30000);

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
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

/**
 * Module 2 & Module 5: TanStack QueryClient + Offline Cache Persistence
 * - Quản lý QueryClient dùng chung toàn ứng dụng (để signOut() gọi queryClient.clear()).
 * - Tự động lưu trữ bền vững (Persistence) dữ liệu courses & assignments kèm mốc thời gian lastSyncedAt.
 * - Kết nối NetInfo với onlineManager của TanStack Query.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { Assignment, Course } from '../types/domain';

export const OFFLINE_CACHE_KEY = 'study_planner_offline_cache_v1';

export interface PersistedStudyCache {
  courses: Course[];
  assignments: Assignment[];
  lastSyncedAt: string;
}

interface NetworkSyncState {
  isOnline: boolean;
  simulatedOffline: boolean;
  simulateServerError500: boolean;
  lastSyncedAt: string | null;
  pendingMutationsCount: number;
  setOnlineStatus: (online: boolean) => void;
  setSimulatedOffline: (offline: boolean) => void;
  setSimulateServerError500: (enabled: boolean) => void;
  setLastSyncedAt: (isoTime: string | null) => void;
  incrementPendingMutations: () => void;
  decrementPendingMutations: () => void;
  resetPendingMutations: () => void;
}

export const useNetworkSyncStore = create<NetworkSyncState>((set) => ({
  isOnline: true,
  simulatedOffline: false,
  simulateServerError500: false,
  lastSyncedAt: null,
  pendingMutationsCount: 0,
  setOnlineStatus: (isOnline) => set({ isOnline }),
  setSimulatedOffline: (simulatedOffline) => set({ simulatedOffline }),
  setSimulateServerError500: (simulateServerError500) => set({ simulateServerError500 }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  incrementPendingMutations: () =>
    set((state) => ({ pendingMutationsCount: state.pendingMutationsCount + 1 })),
  decrementPendingMutations: () =>
    set((state) => ({
      pendingMutationsCount: Math.max(0, state.pendingMutationsCount - 1),
    })),
  resetPendingMutations: () => set({ pendingMutationsCount: 0 }),
}));

export const useIsEffectivelyOfflineSelector = () =>
  useNetworkSyncStore((s) => !s.isOnline || s.simulatedOffline);

export const useLastSyncedAtSelector = () => useNetworkSyncStore((s) => s.lastSyncedAt);

const isTestEnv = process.env.NODE_ENV === 'test';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isTestEnv ? 0 : 1000 * 30,
      gcTime: isTestEnv ? Infinity : 1000 * 60 * 60 * 24, // 24 giờ cho Offline-first, Infinity trong Jest để không giữ timer
      retry: isTestEnv ? false : 1,
    },
    mutations: {
      gcTime: isTestEnv ? Infinity : 1000 * 60 * 5,
      retry: 0,
    },
  },
});

export async function saveOfflineSnapshot(
  courses?: Course[],
  assignments?: Assignment[]
): Promise<string> {
  const nowIso = new Date().toISOString();
  try {
    const existingRaw = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
    const existing: Partial<PersistedStudyCache> = existingRaw ? JSON.parse(existingRaw) : {};
    const snapshot: PersistedStudyCache = {
      courses: courses ?? existing.courses ?? [],
      assignments: assignments ?? existing.assignments ?? [],
      lastSyncedAt: nowIso,
    };
    await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(snapshot));
    useNetworkSyncStore.getState().setLastSyncedAt(nowIso);
  } catch {
    useNetworkSyncStore.getState().setLastSyncedAt(nowIso);
  }
  return nowIso;
}

export async function loadOfflineSnapshot(): Promise<PersistedStudyCache | null> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedStudyCache;
    if (parsed.lastSyncedAt) {
      useNetworkSyncStore.getState().setLastSyncedAt(parsed.lastSyncedAt);
    }
    if (Array.isArray(parsed.courses) && parsed.courses.length > 0) {
      queryClient.setQueryData(['courses'], parsed.courses);
    }
    if (Array.isArray(parsed.assignments) && parsed.assignments.length > 0) {
      queryClient.setQueryData(['assignments'], parsed.assignments);
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearOfflineSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_CACHE_KEY);
  } catch {
    // Ignore storage cleanup error
  }
  useNetworkSyncStore.getState().setLastSyncedAt(null);
}

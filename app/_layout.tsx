/**
 * Root Layout — app/_layout.tsx
 */

import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, LogBox, Platform, StyleSheet, Text, View } from 'react-native';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { configureNotificationHandler } from '../src/services/notifications';
import {
  loadOfflineSnapshot,
  queryClient,
  useNetworkSyncStore,
} from '../src/services/queryClient';
import { useAuthStatus, useAuthStore } from '../src/store/useAuthStore';
import { useAppTheme } from '../src/theme/tokens';

LogBox.ignoreAllLogs();

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message?.includes('500') || e.message?.includes('Giả lập lỗi 500')) {
      e.preventDefault();
    }
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (String(e.reason)?.includes('500') || String(e.reason)?.includes('Giả lập lỗi 500')) {
      e.preventDefault();
    }
  });
}

configureNotificationHandler();

function NavigationAndDeepLinkController({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const authStatus = useAuthStatus();
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const { colors, typography, isDark } = useAppTheme();

  useEffect(() => {
    void loadOfflineSnapshot();
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      useNetworkSyncStore.getState().setOnlineStatus(online);
      const { simulatedOffline } = useNetworkSyncStore.getState();
      onlineManager.setOnline(online && !simulatedOffline);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authStatus === 'hydrating') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (authStatus === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (authStatus === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [authStatus, segments, router]);

  useEffect(() => {
    if (Platform.OS === 'web' || authStatus !== 'authenticated') {
      return;
    }

    const handleNotificationResponse = (
      response: Notifications.NotificationResponse | null | undefined
    ) => {
      const data = response?.notification?.request?.content?.data as
        | { assignmentId?: string; url?: string }
        | undefined;
      if (data?.assignmentId) {
        router.push(`/assignment/${data.assignmentId}`);
      } else if (typeof data?.url === 'string' && data.url.startsWith('/assignment/')) {
        router.push(data.url as `/assignment/${string}`);
      }
    };

    Notifications.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (lastResponse) {
          handleNotificationResponse(lastResponse);
        }
      })
      .catch(() => {
        // Ignore on unsupported environments
      });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, router]);

  if (authStatus === 'hydrating') {
    return (
      <View
        testID="auth-hydrating-screen"
        style={[styles.splashContainer, { backgroundColor: colors.backgroundPrimary }]}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginTop: 16 },
          ]}
        >
          Study Planner
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          Đang kiểm tra phiên bảo mật từ Expo SecureStore...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.appRoot, { backgroundColor: colors.backgroundPrimary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {authStatus === 'authenticated' && <OfflineBanner />}
      <View style={styles.appRoot}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  const { colors } = useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationAndDeepLinkController>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.backgroundPrimary },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.backgroundPrimary },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="assignment/[id]"
            options={{
              title: 'Chi tiết Bài tập',
              headerBackTitle: 'Quay lại',
            }}
          />
          <Stack.Screen
            name="modal/editor"
            options={{
              presentation: 'modal',
              title: 'Thêm và Chỉnh sửa',
            }}
          />
          <Stack.Screen name="+not-found" options={{ title: 'Không tìm thấy trang' }} />
        </Stack>
      </NavigationAndDeepLinkController>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});

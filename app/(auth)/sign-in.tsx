/**
 * Module 2 (Bước 2.3): Màn hình Đăng nhập app/(auth)/sign-in.tsx (Màn hình 1/5+)
 * Giao diện lọc & chuyển thể từ "Student Planner App (Community).fig":
 * - Màn hình "3.2. Login" & "3.3. Password" (Header Title 1 Bold 27/32 + Subheadline 15/20)
 * - Ô nhập liệu ".Field" (height: 56, borderRadius: 16)
 * - Nút "Button=Primary" (height: 56, borderRadius: 16, vùng chạm >= 44x44)
 * - Xử lý đủ 4 trạng thái: Loading, Error + nút Retry, Empty/Form, Content.
 * - Lưu phiên bảo mật bằng Expo SecureStore (sống sót qua Force Quit và xóa sạch khi Sign Out).
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { ScreenStateView } from '../../src/components/ScreenStateView';
import {
  useAuthError,
  useAuthStore,
  useAuthSubmitting,
} from '../../src/store/useAuthStore';
import { MIN_TOUCH_TARGET, useAppTheme } from '../../src/theme/tokens';

const QUICK_ACCOUNTS = [
  {
    code: '1923050251',
    name: 'Lại Văn Thành',
    email: '1923050251@dntu.edu.vn',
  },
  {
    code: '1923050209',
    name: 'Nguyễn Lê Minh Thành',
    email: '1923050209@dntu.edu.vn',
  },
  {
    code: '1923050707',
    name: 'Mai Hoàng Tuấn',
    email: '1923050707@dntu.edu.vn',
  },
];

export default function SignInScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark, toggleTheme } = useAppTheme();

  const signIn = useAuthStore((s) => s.signIn);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);
  const isSubmitting = useAuthSubmitting();
  const authError = useAuthError();

  const [email, setEmail] = useState('1923050251@dntu.edu.vn');
  const [password, setPassword] = useState('dntu2026');
  const [studentName, setStudentName] = useState('Lại Văn Thành (1923050251)');
  const [showEmptyGuide, setShowEmptyGuide] = useState(false);

  const handleSignIn = async () => {
    const ok = await signIn({ email, password, studentName });
    if (ok) {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundPrimary }]}
    >
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Thanh trên cùng: Huy hiệu trường & nút đổi Light/Dark từ 1 file token */}
          <View style={styles.topBar}>
            <View
              style={[
                styles.universityBadge,
                {
                  backgroundColor: colors.primarySoft,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs + 2,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: colors.primary }]}>
                🎓 DNTU • 23DTH1 • Topic 01
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chuyển đổi giao diện Sáng hoặc Tối"
              onPress={toggleTheme}
              style={[
                styles.themeButton,
                {
                  minHeight: MIN_TOUCH_TARGET,
                  minWidth: MIN_TOUCH_TARGET,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                },
              ]}
            >
              <Text style={[typography.footnoteSemibold, { color: colors.textPrimary }]}>
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </Pressable>
          </View>

          {/* Header chuẩn Figma "3.2. Login" (Title 1 Bold 27/32 + Subheadline 15/20) */}
          <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
            <Text style={[typography.title1, { color: colors.textPrimary }]}>
              Đăng nhập Study Planner
            </Text>
            <Text
              style={[
                typography.subheadline,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              Nhập email sinh viên và mật khẩu. Phiên làm việc được mã hóa trong Expo SecureStore
              và tự động duy trì ngay cả khi đóng hẳn ứng dụng (Force Quit).
            </Text>
          </View>

          {/* Khung 4 trạng thái chuẩn hóa qua ScreenStateView */}
          <ScreenStateView
            isLoading={isSubmitting}
            loadingLabel="Đang xác thực và lưu phiên bảo mật vào Expo SecureStore..."
            isError={Boolean(authError)}
            errorTitle="Xác thực không thành công"
            errorMessage={authError ?? undefined}
            onRetry={() => {
              clearAuthError();
              if (password === 'error500') {
                setPassword('dntu2026');
              }
            }}
            isEmpty={showEmptyGuide}
            emptyTitle="Chưa có thông tin tài khoản"
            emptyMessage="Chọn một trong 3 mã số sinh viên của nhóm để tự động điền thông tin đăng nhập mẫu."
            emptyActionLabel="Điền tài khoản 1923050251"
            onEmptyAction={() => {
              setEmail('1923050251@dntu.edu.vn');
              setPassword('dntu2026');
              setStudentName('Lại Văn Thành (1923050251)');
              setShowEmptyGuide(false);
            }}
          >
            {/* Chọn nhanh tài khoản 3 thành viên trong nhóm */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={[
                  typography.footnoteSemibold,
                  { color: colors.textSecondary, marginBottom: spacing.sm },
                ]}
              >
                CHỌN NHANH THÀNH VIÊN NHÓM:
              </Text>
              <View style={styles.quickAccountsRow}>
                {QUICK_ACCOUNTS.map((acc) => {
                  const selected = email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <Pressable
                      key={acc.code}
                      testID={`quick-account-${acc.code}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn tài khoản sinh viên ${acc.code}`}
                      onPress={() => {
                        clearAuthError();
                        setEmail(acc.email);
                        setPassword('dntu2026');
                        setStudentName(`${acc.name} (${acc.code})`);
                      }}
                      style={[
                        styles.accountChip,
                        {
                          minHeight: MIN_TOUCH_TARGET,
                          backgroundColor: selected
                            ? colors.primarySoft
                            : colors.backgroundSecondary,
                          borderColor: selected ? colors.primary : colors.borderSubtle,
                          borderRadius: radius.md,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.footnoteSemibold,
                          { color: selected ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {acc.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Ô nhập Email theo chuẩn Figma UI Kit ".Field" (height 56, borderRadius 16) */}
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                Email sinh viên
              </Text>
              <TextInput
                testID="signin-email-input"
                accessibilityLabel="Email sinh viên"
                value={email}
                onChangeText={(val) => {
                  if (authError) clearAuthError();
                  setEmail(val);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="mssv@dntu.edu.vn"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              />
            </View>

            {/* Ô nhập Họ tên hiển thị */}
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                Họ tên & MSSV
              </Text>
              <TextInput
                testID="signin-name-input"
                accessibilityLabel="Họ tên và mã số sinh viên"
                value={studentName}
                onChangeText={setStudentName}
                placeholder="Nhập họ tên sinh viên"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              />
            </View>

            {/* Ô nhập Mật khẩu theo chuẩn Figma "3.3. Password" */}
            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={[
                  typography.subheadlineSemibold,
                  { color: colors.textPrimary, marginBottom: spacing.xs },
                ]}
              >
                Mật khẩu (tối thiểu 6 ký tự)
              </Text>
              <TextInput
                testID="signin-password-input"
                accessibilityLabel="Mật khẩu đăng nhập"
                value={password}
                onChangeText={(val) => {
                  if (authError) clearAuthError();
                  setPassword(val);
                }}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  styles.figmaField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.lg,
                    color: colors.textPrimary,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              />
            </View>

            {/* Nút Đăng nhập chính (Figma Button=Primary, height: 56, r=16) */}
            <AccessibleButton
              testID="signin-submit-button"
              label="Đăng nhập vào Study Planner"
              accessibilityLabel="Đăng nhập vào Study Planner"
              onPress={handleSignIn}
              style={{ minHeight: 56, borderRadius: radius.lg }}
            />

            {/* Các nút kiểm chứng 4 trạng thái (Error + Retry / Empty) cho buổi bảo vệ */}
            <View
              style={[
                styles.demoStateBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderSubtle,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  marginTop: spacing.xxl,
                },
              ]}
            >
              <Text style={[typography.captionSemibold, { color: colors.textSecondary }]}>
                🛠️ BẢNG KIỂM THỬ 4 TRẠNG THÁI (DÀNH CHO DEMO BẢO VỆ):
              </Text>
              <View style={[styles.demoButtonRow, { marginTop: spacing.sm }]}>
                <AccessibleButton
                  label="Giả lập Lỗi + Retry"
                  accessibilityLabel="Giả lập trạng thái lỗi xác thực và nút thử lại"
                  variant="secondary"
                  onPress={() => {
                    setPassword('error500');
                    void signIn({ email, password: 'error500', studentName });
                  }}
                  style={styles.flexOne}
                />
                <AccessibleButton
                  label="Trạng thái Empty"
                  accessibilityLabel="Xem trạng thái Empty của màn hình đăng nhập"
                  variant="secondary"
                  onPress={() => setShowEmptyGuide(true)}
                  style={styles.flexOne}
                />
              </View>
            </View>
          </ScreenStateView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  universityBadge: {
    alignSelf: 'flex-start',
  },
  themeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountChip: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  figmaField: {
    height: 56,
    borderWidth: 1,
  },
  demoStateBox: {
    borderWidth: 1,
  },
  demoButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
});

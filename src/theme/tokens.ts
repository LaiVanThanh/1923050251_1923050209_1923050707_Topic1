/**
 * Module 1: Single Source of Truth Theme Tokens
 * Bảng màu tối giản theo phong cách Google Tasks:
 * - Tông màu chủ đạo: Google Blue (#1A73E8 trên Light Mode, #8AB4F8 trên Dark Mode)
 * - Nền trắng/xám trung tính sạch sẽ, không dùng màu sắc lòe loẹt.
 * - QUY TẮC BẮT BUỘC: Tuyệt đối không viết bất kỳ mã màu hex (#...) nào ở ngoài file tokens.ts này.
 * - Mọi văn bản thân bài đều đảm bảo độ tương phản WCAG AA >= 4.5:1 trên cả Light & Dark mode.
 */

import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { CourseColorKey } from '../types/domain';

export type ThemeModePreference = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

export interface CourseColorToken {
  accent: string;
  softBg: string;
  border: string;
  text: string;
}

export interface AppThemeColors {
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surfaceCard: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  separator: string;
  borderSubtle: string;
  borderFocus: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlayBackdrop: string;
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;
  scopeBarBg: string;
  scopeBarPill: string;
  offlineBannerBg: string;
  offlineBannerText: string;
  courseColors: Record<CourseColorKey, CourseColorToken>;
}

const LIGHT_GOOGLE_TASK_COURSE_TOKEN: CourseColorToken = {
  accent: '#1A73E8',
  softBg: '#E8F0FE',
  border: '#D2E3FC',
  text: '#174EA6',
};

const LIGHT_NEUTRAL_TASK_COURSE_TOKEN: CourseColorToken = {
  accent: '#1A73E8',
  softBg: '#F1F3F4',
  border: '#DADCE0',
  text: '#3C4043',
};

/**
 * Bảng màu Light Mode chuẩn Google Tasks (Trắng #FFFFFF, Xám nhạt #F8F9FA / #F1F3F4, Chữ #202124 / #5F6368, Google Blue #1A73E8)
 */
export const LIGHT_COLORS: AppThemeColors = {
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F4',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#F8F9FA',
  textPrimary: '#202124', // Contrast 16.1:1 trên #FFFFFF
  textSecondary: '#5F6368', // Contrast 6.0:1 trên #FFFFFF (>= 4.5:1)
  textTertiary: '#5F6368',
  textInverse: '#FFFFFF',
  primary: '#1A73E8', // Google Tasks Blue
  primaryPressed: '#1557B0',
  primarySoft: '#E8F0FE',
  separator: '#DADCE0',
  borderSubtle: '#DADCE0',
  borderFocus: '#1A73E8',
  success: '#1A73E8',
  successSoft: '#E8F0FE',
  warning: '#3C4043',
  warningSoft: '#F1F3F4',
  danger: '#D93025', // Google Red cho cảnh báo lỗi
  dangerSoft: '#FCE8E6',
  info: '#1A73E8',
  infoSoft: '#E8F0FE',
  overlayBackdrop: 'rgba(32, 33, 36, 0.45)',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#1A73E8',
  tabBarInactive: '#5F6368',
  scopeBarBg: '#F1F3F4',
  scopeBarPill: '#FFFFFF',
  offlineBannerBg: '#F1F3F4',
  offlineBannerText: '#202124',
  courseColors: {
    blue: LIGHT_GOOGLE_TASK_COURSE_TOKEN,
    indigo: LIGHT_NEUTRAL_TASK_COURSE_TOKEN,
    purple: LIGHT_GOOGLE_TASK_COURSE_TOKEN,
    teal: LIGHT_NEUTRAL_TASK_COURSE_TOKEN,
    green: LIGHT_GOOGLE_TASK_COURSE_TOKEN,
    orange: LIGHT_NEUTRAL_TASK_COURSE_TOKEN,
    pink: LIGHT_GOOGLE_TASK_COURSE_TOKEN,
    red: LIGHT_NEUTRAL_TASK_COURSE_TOKEN,
  },
};

const DARK_GOOGLE_TASK_COURSE_TOKEN: CourseColorToken = {
  accent: '#8AB4F8',
  softBg: '#1E3A5F',
  border: '#3C4043',
  text: '#D2E3FC',
};

const DARK_NEUTRAL_TASK_COURSE_TOKEN: CourseColorToken = {
  accent: '#8AB4F8',
  softBg: '#303134',
  border: '#3C4043',
  text: '#E8EAED',
};

/**
 * Bảng màu Dark Mode chuẩn Google Tasks (Nền #202124 / #292A2D, Chữ #E8EAED / #9AA0A6, Google Blue #8AB4F8)
 */
export const DARK_COLORS: AppThemeColors = {
  backgroundPrimary: '#202124',
  backgroundSecondary: '#292A2D',
  backgroundTertiary: '#303134',
  surfaceCard: '#292A2D',
  surfaceElevated: '#303134',
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textTertiary: '#9AA0A6',
  textInverse: '#202124',
  primary: '#8AB4F8', // Google Tasks Dark Blue
  primaryPressed: '#669DF6',
  primarySoft: '#1E3A5F',
  separator: '#3C4043',
  borderSubtle: '#3C4043',
  borderFocus: '#8AB4F8',
  success: '#8AB4F8',
  successSoft: '#1E3A5F',
  warning: '#E8EAED',
  warningSoft: '#303134',
  danger: '#F28B82',
  dangerSoft: '#3C2020',
  info: '#8AB4F8',
  infoSoft: '#1E3A5F',
  overlayBackdrop: 'rgba(0, 0, 0, 0.72)',
  tabBarBg: '#202124',
  tabBarActive: '#8AB4F8',
  tabBarInactive: '#9AA0A6',
  scopeBarBg: '#303134',
  scopeBarPill: '#3C4043',
  offlineBannerBg: '#303134',
  offlineBannerText: '#E8EAED',
  courseColors: {
    blue: DARK_GOOGLE_TASK_COURSE_TOKEN,
    indigo: DARK_NEUTRAL_TASK_COURSE_TOKEN,
    purple: DARK_GOOGLE_TASK_COURSE_TOKEN,
    teal: DARK_NEUTRAL_TASK_COURSE_TOKEN,
    green: DARK_GOOGLE_TASK_COURSE_TOKEN,
    orange: DARK_NEUTRAL_TASK_COURSE_TOKEN,
    pink: DARK_GOOGLE_TASK_COURSE_TOKEN,
    red: DARK_NEUTRAL_TASK_COURSE_TOKEN,
  },
};

export const TYPOGRAPHY = {
  largeTitle: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: 0 },
  title1: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const, letterSpacing: 0 },
  title2: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const, letterSpacing: 0 },
  title3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0 },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0 },
  calloutSemibold: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const, letterSpacing: 0 },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, letterSpacing: 0 },
  subheadlineSemibold: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0 },
  subheadline: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0 },
  footnoteSemibold: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: 0 },
  captionSemibold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  caption2Semibold: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0 },
  tabBar: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 44;

interface ThemePreferenceState {
  preference: ThemeModePreference;
  setPreference: (pref: ThemeModePreference) => void;
  toggleTheme: (currentResolved: ResolvedThemeMode) => void;
}

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
  toggleTheme: (currentResolved) =>
    set({ preference: currentResolved === 'dark' ? 'light' : 'dark' }),
}));

export interface AppTheme {
  mode: ResolvedThemeMode;
  preference: ThemeModePreference;
  isDark: boolean;
  colors: AppThemeColors;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  minTouchTarget: number;
  setPreference: (pref: ThemeModePreference) => void;
  toggleTheme: () => void;
}

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const preference = useThemePreferenceStore((s) => s.preference);
  const setPreference = useThemePreferenceStore((s) => s.setPreference);
  const toggleThemeStore = useThemePreferenceStore((s) => s.toggleTheme);

  const resolvedMode: ResolvedThemeMode =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const isDark = resolvedMode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    mode: resolvedMode,
    preference,
    isDark,
    colors,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    minTouchTarget: MIN_TOUCH_TARGET,
    setPreference,
    toggleTheme: () => toggleThemeStore(resolvedMode),
  };
}

export const COURSE_COLOR_OPTIONS: { key: CourseColorKey; label: string }[] = [
  { key: 'blue', label: 'Xanh chuẩn' },
  { key: 'indigo', label: 'Trung tính' },
];

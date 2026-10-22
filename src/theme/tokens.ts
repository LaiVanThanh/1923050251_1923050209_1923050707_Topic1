/**
 * Module 1 (Bước 1.2): Single Source of Truth Theme Tokens
 * Trích xuất & chuẩn hóa từ "Student Planner App (Community).fig" (UI kit -> Color & Typography).
 * QUY TẮC BẮT BUỘC: Tuyệt đối không viết bất kỳ mã màu hex (#...) nào ở ngoài file tokens.ts này.
 * Mọi văn bản thân bài đều đảm bảo độ tương phản WCAG AA >= 4.5:1 trên cả Light & Dark mode.
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

/**
 * Bảng màu Light Mode (Dựa trên Figma UI Kit Light/* + chuẩn tương phản WCAG AA >= 4.5:1)
 */
export const LIGHT_COLORS: AppThemeColors = {
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#F8F8FA',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#F7F7FA',
  textPrimary: '#191A1C', // Contrast 17.4:1 trên #FFFFFF
  textSecondary: '#48484A', // Contrast 9.0:1 trên #FFFFFF và 8.0:1 trên #F2F2F7 (>= 4.5:1)
  textTertiary: '#636366', // Contrast 5.9:1 trên #FFFFFF (>= 4.5:1)
  textInverse: '#FFFFFF',
  primary: '#0062CC', // Contrast 5.9:1 với #FFFFFF (Figma Blue #007AFF tinh chỉnh đạt chuẩn AA)
  primaryPressed: '#004999',
  primarySoft: '#E6F0FF',
  separator: '#C6C6C8',
  borderSubtle: '#E5E5EA',
  borderFocus: '#0062CC',
  success: '#1E7E34', // Contrast 5.1:1
  successSoft: '#E8F7EC',
  warning: '#B25000', // Contrast 5.0:1
  warningSoft: '#FFF3E0',
  danger: '#C91C14', // Contrast 6.1:1
  dangerSoft: '#FDECEB',
  info: '#0062CC',
  infoSoft: '#EBF4FF',
  overlayBackdrop: 'rgba(25, 26, 28, 0.45)',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#0062CC',
  tabBarInactive: '#636366',
  scopeBarBg: '#E5E5EA',
  scopeBarPill: '#FFFFFF',
  offlineBannerBg: '#FFF3E0',
  offlineBannerText: '#7A3400',
  courseColors: {
    blue: {
      accent: '#0062CC',
      softBg: '#EBF4FF',
      border: '#B8D8FF',
      text: '#004999',
    },
    indigo: {
      accent: '#4845B5',
      softBg: '#EFEFFD',
      border: '#C5C4F7',
      text: '#36348E',
    },
    purple: {
      accent: '#8936B5',
      softBg: '#F6ECFC',
      border: '#DFBFF5',
      text: '#6A248F',
    },
    teal: {
      accent: '#006D85',
      softBg: '#E6F7FA',
      border: '#AEE4F0',
      text: '#005266',
    },
    green: {
      accent: '#1E7E34',
      softBg: '#E8F7EC',
      border: '#B4E3C0',
      text: '#155D26',
    },
    orange: {
      accent: '#B84A00',
      softBg: '#FFF2E6',
      border: '#FFD1A8',
      text: '#8A3700',
    },
    pink: {
      accent: '#C21847',
      softBg: '#FCEBF0',
      border: '#F7BBD0',
      text: '#941035',
    },
    red: {
      accent: '#C91C14',
      softBg: '#FDECEB',
      border: '#F8C1BD',
      text: '#99130D',
    },
  },
};

/**
 * Bảng màu Dark Mode (Dựa trên Figma UI Kit Dark/* + chuẩn tương phản WCAG AA >= 4.5:1)
 */
export const DARK_COLORS: AppThemeColors = {
  backgroundPrimary: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  surfaceCard: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  textPrimary: '#FFFFFF', // Contrast 21:1 trên #000000, 16.5:1 trên #1C1C1E
  textSecondary: '#D1D1D6', // Contrast 10.6:1 trên #1C1C1E (>= 4.5:1)
  textTertiary: '#AEAEB2', // Contrast 7.2:1 trên #1C1C1E (>= 4.5:1)
  textInverse: '#191A1C',
  primary: '#409CFF', // Contrast 6.2:1 trên #1C1C1E
  primaryPressed: '#0A84FF',
  primarySoft: '#102A45',
  separator: '#38383A',
  borderSubtle: '#3A3A3C',
  borderFocus: '#409CFF',
  success: '#30D158',
  successSoft: '#11331B',
  warning: '#FFD60A',
  warningSoft: '#362B07',
  danger: '#FF6961',
  dangerSoft: '#3B1615',
  info: '#64D2FF',
  infoSoft: '#0F2E3D',
  overlayBackdrop: 'rgba(0, 0, 0, 0.72)',
  tabBarBg: '#1C1C1E',
  tabBarActive: '#409CFF',
  tabBarInactive: '#AEAEB2',
  scopeBarBg: '#2C2C2E',
  scopeBarPill: '#3A3A3C',
  offlineBannerBg: '#362B07',
  offlineBannerText: '#FFD60A',
  courseColors: {
    blue: {
      accent: '#409CFF',
      softBg: '#122842',
      border: '#1F4978',
      text: '#82BFFF',
    },
    indigo: {
      accent: '#7D7AFF',
      softBg: '#1E1D42',
      border: '#38367A',
      text: '#B3B1FF',
    },
    purple: {
      accent: '#CA78F5',
      softBg: '#2E1A3B',
      border: '#5A3273',
      text: '#E2B3FA',
    },
    teal: {
      accent: '#64D2FF',
      softBg: '#112E3B',
      border: '#20566E',
      text: '#9EE2FF',
    },
    green: {
      accent: '#30D158',
      softBg: '#11331B',
      border: '#206133',
      text: '#7CE395',
    },
    orange: {
      accent: '#FF9F0A',
      softBg: '#382409',
      border: '#6E4611',
      text: '#FFC66E',
    },
    pink: {
      accent: '#FF6482',
      softBg: '#3B1520',
      border: '#73293F',
      text: '#FFA3B5',
    },
    red: {
      accent: '#FF6961',
      softBg: '#3B1615',
      border: '#732B28',
      text: '#FFA8A3',
    },
  },
};

/**
 * Thang Typography từ Figma UI Kit ("Typography" Frame)
 */
export const TYPOGRAPHY = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800' as const, letterSpacing: 0.35 },
  title1: { fontSize: 27, lineHeight: 32, fontWeight: '700' as const, letterSpacing: 0.35 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: 0.3 },
  title3: { fontSize: 19, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.3 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' as const, letterSpacing: -0.3 },
  calloutSemibold: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.2 },
  subheadlineSemibold: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.2 },
  footnoteSemibold: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: -0.08 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
  captionSemibold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  caption2Semibold: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.07 },
  tabBar: { fontSize: 11, lineHeight: 13, fontWeight: '600' as const, letterSpacing: 0.1 },
};

/**
 * Kích thước & Bo góc chuẩn từ Figma UI Kit
 * (.Field r=16, Button r=16, ViewCard-news r=16, TableHeader r=12, Date circle r=44)
 */
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
  { key: 'blue', label: 'Xanh dương' },
  { key: 'indigo', label: 'Chàm' },
  { key: 'purple', label: 'Tím' },
  { key: 'teal', label: 'Xanh ngọc' },
  { key: 'green', label: 'Xanh lá' },
  { key: 'orange', label: 'Cam' },
  { key: 'pink', label: 'Hồng' },
  { key: 'red', label: 'Đỏ' },
];

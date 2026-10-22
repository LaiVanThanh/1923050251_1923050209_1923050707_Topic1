/**
 * Module 1 (Bước 1.4): AccessibleButton
 * Ép kích thước vùng chạm tối thiểu 44 x 44 (MIN_TOUCH_TARGET)
 * kèm accessibilityRole="button" và accessibilityLabel theo chuẩn Accessibility.
 * Giao diện nút lấy từ "Student Planner App (Community).fig" (UI kit -> Button, r=16).
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { MIN_TOUCH_TARGET, useAppTheme } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

export interface AccessibleButtonProps {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  selected?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  testID,
  selected,
}) => {
  const { colors, typography, radius, spacing } = useAppTheme();
  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean): string => {
    if (variant === 'primary') {
      return pressed ? colors.primaryPressed : colors.primary;
    }
    if (variant === 'secondary') {
      return pressed ? colors.borderSubtle : colors.backgroundSecondary;
    }
    if (variant === 'danger') {
      return pressed ? colors.danger : colors.dangerSoft;
    }
    if (variant === 'outline') {
      return pressed ? colors.primarySoft : colors.surfaceCard;
    }
    return pressed ? colors.backgroundSecondary : 'transparent';
  };

  const getTextColor = (): string => {
    if (variant === 'primary') {
      return colors.textInverse;
    }
    if (variant === 'danger') {
      return colors.danger;
    }
    if (variant === 'outline') {
      return colors.primary;
    }
    return colors.textPrimary;
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return colors.primary;
    }
    if (variant === 'danger') {
      return colors.danger;
    }
    if (variant === 'secondary') {
      return colors.borderSubtle;
    }
    return 'transparent';
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading, selected }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: MIN_TOUCH_TARGET,
          minWidth: MIN_TOUCH_TARGET,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 2,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'danger' || variant === 'secondary' ? 1 : 0,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={{ marginRight: spacing.sm }}
          />
        ) : (
          iconLeft && <View style={{ marginRight: spacing.sm }}>{iconLeft}</View>
        )}
        <Text
          style={[
            typography.calloutSemibold,
            { color: getTextColor(), textAlign: 'center' },
            textStyle,
          ]}
        >
          {label}
        </Text>
        {iconRight && <View style={{ marginLeft: spacing.sm }}>{iconRight}</View>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

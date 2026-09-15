import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

interface VariantStyle {
  container: string;
  text: string;
  spinnerColor: string;
  iconColor: string;
}

const variantMap: Record<ButtonVariant, VariantStyle> = {
  primary: {
    container: 'bg-primary active:opacity-80',
    text: 'text-white',
    spinnerColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  secondary: {
    container: 'bg-card dark:bg-dark-card border border-border dark:border-dark-border active:opacity-80',
    text: 'text-text dark:text-dark-text',
    spinnerColor: '#2563EB',
    iconColor: '#2563EB',
  },
  danger: {
    container: 'bg-danger active:opacity-80',
    text: 'text-white',
    spinnerColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  success: {
    container: 'bg-success active:opacity-80',
    text: 'text-white',
    spinnerColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  ghost: {
    container: 'bg-transparent active:opacity-60',
    text: 'text-primary dark:text-primary',
    spinnerColor: '#2563EB',
    iconColor: '#2563EB',
  },
};

const sizeMap: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: { container: 'px-3 py-1.5 rounded-md', text: 'text-xs', icon: 14 },
  md: { container: 'px-4 py-2.5 rounded-lg', text: 'text-sm', icon: 16 },
  lg: { container: 'px-5 py-3.5 rounded-xl', text: 'text-base', icon: 20 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const { colors } = useTheme();
  const v = variantMap[variant];
  const s = sizeMap[size];
  const isDisabled = disabled || loading;
  const widthClass = fullWidth ? 'w-full' : '';

  const iconColor = variant === 'secondary' ? colors.primary : v.iconColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${v.container} ${s.container} ${widthClass} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' ? (
            <Ionicons
              name={icon}
              size={s.icon}
              color={iconColor}
              style={{ marginRight: 6 }}
            />
          ) : null}
          <Text className={`${v.text} ${s.text} font-semibold`}>{title}</Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons
              name={icon}
              size={s.icon}
              color={iconColor}
              style={{ marginLeft: 6 }}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
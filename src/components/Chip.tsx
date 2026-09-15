import React from 'react';
import { Pressable, Text, View } from 'react-native';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  selected?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantMap: Record<ChipVariant, string> = {
  default:
    'bg-border/50 dark:bg-dark-border border-border dark:border-dark-border',
  primary:
    'bg-primary/15 dark:bg-primary/20 border-primary/40 dark:border-primary/50',
  success:
    'bg-success/15 dark:bg-success/20 border-success/40 dark:border-success/50',
  warning:
    'bg-warning/15 dark:bg-warning/20 border-warning/40 dark:border-warning/50',
  danger:
    'bg-danger/15 dark:bg-danger/20 border-danger/40 dark:border-danger/50',
  info:
    'bg-secondary/15 dark:bg-secondary/20 border-secondary/40 dark:border-secondary/50',
};

const textVariantMap: Record<ChipVariant, string> = {
  default: 'text-text dark:text-dark-text',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-secondary',
};

export default function Chip({
  label,
  variant = 'default',
  onPress,
  selected = false,
  icon,
  className = '',
}: ChipProps) {
  const base = `flex-row items-center px-3 py-1.5 rounded-full border ${variantMap[variant]} ${
    selected ? 'border-2' : ''
  } ${className}`;

  const content = (
    <>
      {icon ? <View className="mr-1.5">{icon}</View> : null}
      <Text className={`text-xs font-medium ${textVariantMap[variant]}`}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-70`}>
        {content}
      </Pressable>
    );
  }

  return <View className={base}>{content}</View>;
}
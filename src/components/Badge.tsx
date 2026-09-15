import React from 'react';
import { View, Text } from 'react-native';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  className?: string;
}

const toneMap: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: {
    bg: 'bg-border/40 dark:bg-dark-border',
    text: 'text-text dark:text-dark-text',
  },
  primary: {
    bg: 'bg-primary/15 dark:bg-primary/20',
    text: 'text-primary',
  },
  success: {
    bg: 'bg-success/15 dark:bg-success/20',
    text: 'text-success',
  },
  warning: {
    bg: 'bg-warning/15 dark:bg-warning/20',
    text: 'text-warning',
  },
  danger: {
    bg: 'bg-danger/15 dark:bg-danger/20',
    text: 'text-danger',
  },
  info: {
    bg: 'bg-secondary/15 dark:bg-secondary/20',
    text: 'text-secondary',
  },
};

export default function Badge({
  label,
  tone = 'neutral',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const { bg, text } = toneMap[tone];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View className={`${bg} ${sizeClass} rounded-md self-start ${className}`}>
      <Text className={`${text} ${textSize} font-semibold uppercase tracking-wide`}>
        {label}
      </Text>
    </View>
  );
}
import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from './Button';
import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 items-center justify-center px-8 py-12 ${className}`}>
      <View className="w-16 h-16 rounded-full bg-border/50 dark:bg-dark-border items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color={colors.muted} />
      </View>
      <Text className="text-text dark:text-dark-text text-base font-semibold text-center">
        {title}
      </Text>
      {message ? (
        <Text className="text-muted dark:text-dark-muted text-sm text-center mt-2 leading-5">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-5">
          <Button title={actionLabel} onPress={onAction} variant="primary" icon="add" />
        </View>
      ) : null}
    </View>
  );
}
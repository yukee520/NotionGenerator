import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export default function LoadingView({
  message = 'Loading…',
  size = 'large',
  className = '',
}: LoadingViewProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 items-center justify-center py-12 ${className}`}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message ? (
        <Text className="text-muted dark:text-dark-muted text-sm mt-3">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from './Button';
import { useTheme } from '@/hooks/useTheme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 items-center justify-center px-8 py-12 ${className}`}>
      <View className="w-16 h-16 rounded-full bg-danger/15 items-center justify-center mb-4">
        <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
      </View>
      <Text className="text-text dark:text-dark-text text-base font-semibold text-center">
        {title}
      </Text>
      <Text className="text-muted dark:text-dark-muted text-sm text-center mt-2 leading-5">
        {message}
      </Text>
      {onRetry ? (
        <View className="mt-5">
          <Button title={retryLabel} onPress={onRetry} variant="primary" icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}
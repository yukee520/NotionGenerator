import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  className = '',
}: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between mt-5 mb-2 ${className}`}>
      <Text className="text-muted dark:text-dark-muted text-xs font-semibold uppercase tracking-wider">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} className="active:opacity-60">
          <Text className="text-primary text-xs font-semibold">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
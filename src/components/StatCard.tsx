import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  tint?: string;
  onPress?: () => void;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  tint,
  onPress,
  className = '',
}: StatCardProps) {
  const { colors } = useTheme();
  const iconColor = tint ?? colors.primary;

  const content = (
    <View className={`flex-1 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3 ${className}`}>
      <View className="flex-row items-center justify-between mb-2">
        {icon ? (
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${iconColor}22` }}
          >
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        ) : (
          <View />
        )}
      </View>
      <Text className="text-text dark:text-dark-text text-2xl font-bold">
        {value}
      </Text>
      <Text className="text-muted dark:text-dark-muted text-xs mt-0.5" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="flex-1 active:opacity-80">
        {content}
      </Pressable>
    );
  }

  return content;
}
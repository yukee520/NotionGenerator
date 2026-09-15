import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  rightText?: string;
  className?: string;
}

export default function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  showChevron = false,
  rightText,
  className = '',
}: ListItemProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {leading ? <View className="mr-3">{leading}</View> : null}

      <View className="flex-1">
        <Text
          className="text-text dark:text-dark-text text-sm font-medium"
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-muted dark:text-dark-muted text-xs mt-0.5"
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightText ? (
        <Text className="text-muted dark:text-dark-muted text-xs ml-3">
          {rightText}
        </Text>
      ) : null}

      {trailing ? <View className="ml-3">{trailing}</View> : null}

      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={{ marginLeft: 8 }}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`flex-row items-center py-3 px-1 active:opacity-70 ${className}`}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className={`flex-row items-center py-3 px-1 ${className}`}>
      {content}
    </View>
  );
}
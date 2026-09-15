import React from 'react';
import { Pressable, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useShare } from '@/hooks/useShare';
import { useTheme } from '@/hooks/useTheme';

export interface ShareButtonProps {
  title?: string;
  message: string;
  url?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

export default function ShareButton({
  title,
  message,
  url,
  label = 'Share',
  compact = false,
  className = '',
}: ShareButtonProps) {
  const { colors } = useTheme();
  const { share } = useShare();

  const handle = () => {
    void share({ title, message, url });
  };

  return (
    <Pressable
      onPress={handle}
      hitSlop={8}
      className={`flex-row items-center ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg bg-secondary/10 dark:bg-secondary/20 active:opacity-70 ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="share-outline" size={compact ? 14 : 16} color={colors.secondary} />
      {!compact ? (
        <Text className="text-secondary text-xs font-semibold ml-1.5">{label}</Text>
      ) : null}
    </Pressable>
  );
}
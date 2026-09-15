import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useClipboard } from '@/hooks/useClipboard';
import { useTheme } from '@/hooks/useTheme';

export interface CopyButtonProps {
  value: string;
  label?: string;
  icon?: string;
  compact?: boolean;
  className?: string;
}

export default function CopyButton({
  value,
  label = 'Copy',
  icon = 'copy-outline',
  compact = false,
  className = '',
}: CopyButtonProps) {
  const { colors } = useTheme();
  const { copy } = useClipboard();
  const [busy, setBusy] = React.useState(false);

  const handleCopy = async () => {
    setBusy(true);
    await copy(value);
    setTimeout(() => setBusy(false), 400);
  };

  return (
    <Pressable
      onPress={handleCopy}
      hitSlop={8}
      className={`flex-row items-center ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg bg-primary/10 dark:bg-primary/20 active:opacity-70 ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name={icon} size={compact ? 14 : 16} color={colors.primary} />
      )}
      {!compact ? (
        <Text className="text-primary text-xs font-semibold ml-1.5">{label}</Text>
      ) : null}
    </Pressable>
  );
}
import React from 'react';
import { Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface FabProps {
  icon?: string;
  onPress: () => void;
  bottom?: number;
  right?: number;
  label?: string;
  className?: string;
}

export default function Fab({
  icon = 'add',
  onPress,
  bottom = 20,
  right = 20,
  label,
  className = '',
}: FabProps) {
  const { colors, shadow } = useTheme();
  const isExtended = Boolean(label);

  return (
    <Pressable
      onPress={onPress}
      style={{ position: 'absolute', bottom, right, ...shadow.floating }}
      className={`bg-primary rounded-full ${
        isExtended ? 'px-5 py-3.5 flex-row items-center' : 'w-14 h-14 items-center justify-center'
      } active:opacity-80 ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Add'}
    >
      <Ionicons name={icon} size={isExtended ? 20 : 26} color="#FFFFFF" />
      {label ? (
        <Ionicons
          name="chevron-forward"
          size={0}
          color="transparent"
          style={{ width: 0 }}
        />
      ) : null}
    </Pressable>
  );
}
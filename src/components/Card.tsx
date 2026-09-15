import React from 'react';
import { View, Pressable } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  className?: string;
}

export default function Card({
  children,
  onPress,
  padded = true,
  className = '',
}: CardProps) {
  const padding = padded ? 'p-4' : '';
  const base = `bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl ${padding} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${base} active:opacity-80`}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View className={base}>{children}</View>;
}
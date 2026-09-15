import React from 'react';
import { View } from 'react-native';

export interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <View
      className={`h-px bg-border dark:bg-dark-border w-full ${className}`}
    />
  );
}
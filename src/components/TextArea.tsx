import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface TextAreaProps
  extends Omit<TextInputProps, 'style' | 'className' | 'multiline'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  minHeight?: number;
  className?: string;
  inputClassName?: string;
}

export default function TextArea({
  label,
  error,
  hint,
  required = false,
  minHeight = 100,
  className = '',
  inputClassName = '',
  ...rest
}: TextAreaProps) {
  const { colors } = useTheme();
  const hasError = Boolean(error);

  return (
    <View className={`mb-3 ${className}`}>
      {label ? (
        <View className="flex-row items-center mb-1.5">
          <Text className="text-text dark:text-dark-text text-sm font-medium">
            {label}
          </Text>
          {required ? (
            <Text className="text-danger text-sm ml-1">*</Text>
          ) : null}
        </View>
      ) : null}

      <TextInput
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.muted}
        style={{ minHeight }}
        className={`bg-card dark:bg-dark-card border ${
          hasError ? 'border-danger' : 'border-border dark:border-dark-border'
        } rounded-lg px-3 py-2.5 text-text dark:text-dark-text text-sm ${inputClassName}`}
        {...rest}
      />

      {hasError ? (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-muted dark:text-dark-muted text-xs mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}